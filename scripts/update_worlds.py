"""Met a jour equipes et joueurs qualifies pour les Worlds depuis Leaguepedia.

Usage : python scripts/update_worlds.py [--dry-run]
- ajoute les equipes qualifiees absentes de players.json (logo carre, couleur)
- ajoute leurs joueurs (poste, pays, photo la plus recente)
- retire les joueurs qui ne figurent plus dans le roster officiel
Les joueurs deja presents ne sont pas retouches.
"""

import hashlib
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAYERS_JSON = os.path.join(ROOT, "src", "data", "players.json")
PUBLIC = os.path.join(ROOT, "public")
TOURNAMENT = "2026 Season World Championship"
DRY = "--dry-run" in sys.argv

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
CARGO_HEADERS = {
    "User-Agent": UA,
    "Accept": "application/json,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://lol.fandom.com/wiki/Special:CargoTables",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
}

REGION_LEAGUE = {
    "Korea": "LCK",
    "China": "LPL",
    "EMEA": "LEC",
    "North America": "LCS",
    "Asia-Pacific": "LCP",
    "Asia Pacific": "LCP",
    "Brazil": "CBLOL",
}
ROLES = {"Top": "top", "Jungle": "jungle", "Mid": "mid", "Bot": "bot", "Support": "support"}
# Equipes qualifiees dont Leaguepedia n'a pas encore saisi le roster Worlds :
# on prend celui de leurs playoffs regionaux. Nom -> (tournoi, page de l'equipe).
REGIONAL_ROSTERS = {
    "Cloud9": ("LCS/2026 Season/Summer Playoffs", "Cloud9"),
    "LYON": ("LCS/2026 Season/Summer Playoffs", "LYON (2024 American Team)"),
    "FURIA": ("CBLOL/2026 Season/Split 2 Playoffs", "FURIA"),
    "LØS": ("CBLOL/2026 Season/Split 2 Playoffs", "LØS"),
}
ROLE_ORDER = ["top", "jungle", "mid", "bot", "support"]


def cargo(**params):
    params.setdefault("format", "json")
    params.setdefault("limit", "500")
    params["title"] = "Special:CargoExport"
    url = "https://lol.fandom.com/index.php?" + urllib.parse.urlencode(params)
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers=CARGO_HEADERS)
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as error:
            if attempt == 3:
                raise
            print("  retry (%s)" % error, file=sys.stderr)
            time.sleep(2 + attempt * 2)


def quote(values):
    return ",".join("'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'" for value in values)


def wikia_url(filename, width):
    name = filename.replace(" ", "_")
    digest = hashlib.md5(name.encode("utf-8")).hexdigest()
    return (
        "https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/%s/%s/%s"
        "/revision/latest/scale-to-width-down/%d"
        % (digest[0], digest[:2], urllib.parse.quote(name), width)
    )


def fetch_image(filename, width, relative):
    """Reutilise le fichier deja present dans public/, sinon le telecharge."""
    local = os.path.join(PUBLIC, relative)
    if os.path.exists(local):
        return Image.open(local).convert("RGBA"), False
    try:
        return download(filename, width), True
    except Exception as error:
        # Le CDN Wikia refuse souvent Python (403) : l'image se recupere alors a la main
        # (navigateur) dans public/<relative>, puis on relance le script.
        print("! image a recuperer (%s) : %s -> public/%s" % (error, wikia_url(filename, width), relative))
        return None, False


def download(filename, width):
    request = urllib.request.Request(
        wikia_url(filename, width),
        headers={"User-Agent": UA, "Referer": "https://lol.fandom.com/"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return Image.open(io.BytesIO(response.read())).convert("RGBA")


def dominant_color(image):
    small = image.resize((64, 64), Image.LANCZOS)
    red = green = blue = count = 0
    for r, g, b, a in small.getdata():
        if a < 180:
            continue
        luminance = r * 0.299 + g * 0.587 + b * 0.114
        if luminance < 28 or luminance > 232:
            continue
        red, green, blue, count = red + r, green + g, blue + b, count + 1
    if not count:
        return "#8b8b95"
    return "#%02x%02x%02x" % (round(red / count), round(green / count), round(blue / count))


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def display_name(raw):
    return re.sub(r"\s*\(.*\)\s*$", "", raw).strip()


def regional_roster(team, page):
    """Roster d'un tournoi regional, un joueur par poste : le dernier titulaire."""
    rows = cargo(
        tables="TournamentPlayers",
        fields="TournamentPlayers.Team=team,TournamentPlayers.Player=player,"
        "TournamentPlayers.Role=role,TournamentPlayers.Link=link",
        where="TournamentPlayers.Team=%s AND TournamentPlayers.OverviewPage=%s" % (quote([team]), quote([page])),
    )
    by_role = {}
    for row in rows:
        if row["role"] in ROLES:
            by_role.setdefault(row["role"], []).append(row)
    members = {}
    for role, candidates in by_role.items():
        if len(candidates) > 1:
            last = cargo(
                tables="ScoreboardPlayers",
                fields="ScoreboardPlayers.Link=link",
                where="ScoreboardPlayers.Team=%s AND ScoreboardPlayers.Role=%s"
                % (quote([team]), quote([role])),
                order_by="ScoreboardPlayers.DateTime_UTC DESC",
                limit="1",
            )
            starter = last[0]["link"] if last else None
            candidates = [row for row in candidates if row["link"] == starter] or candidates[:1]
        members[candidates[0]["link"]] = candidates[0]
    return members


def main():
    data = json.load(open(PLAYERS_JSON, encoding="utf-8"))
    known_teams = {team["name"]: team for team in data["teams"]}
    known_players = {(p["team"], p["name"].lower()): p for p in data["players"]}

    rows = cargo(
        tables="TournamentPlayers",
        fields="TournamentPlayers.Team=team,TournamentPlayers.Player=player,"
        "TournamentPlayers.Role=role,TournamentPlayers.Link=link",
        where="TournamentPlayers.OverviewPage LIKE '%s%%'" % TOURNAMENT,
    )
    roster = {}
    for row in rows:
        if row["role"] not in ROLES or not row["team"]:
            continue
        roster.setdefault(row["team"], {})[row["link"]] = row
    for team, (page, team_page) in REGIONAL_ROSTERS.items():
        if team not in roster and team_page not in roster:
            roster[team] = regional_roster(team_page, page)
    print("%d equipes avec roster sur Leaguepedia" % len(roster))

    team_rows = {
        row["name"]: row
        for row in cargo(
            tables="Teams",
            fields="Teams.Name=name,Teams.Short=short,Teams.Region=region,Teams.OverviewPage=page",
            where="Teams.OverviewPage IN (%s) OR Teams.Name IN (%s)" % (quote(roster.keys()), quote(roster.keys())),
        )
    }

    new_teams, logo_files = [], {}
    for name in roster:
        if name in known_teams:
            continue
        meta = team_rows.get(name)
        if not meta:
            print("! equipe inconnue de la table Teams : %s" % name)
            continue
        league = REGION_LEAGUE.get(meta["region"])
        if not league:
            print("! region sans ligue connue pour %s : %s (ajouter dans REGION_LEAGUE)" % (name, meta["region"]))
            continue
        logo_files[name] = meta["page"] + "logo square.png"
        new_teams.append(
            {
                "short": meta["short"].upper(),
                "name": name,
                "region": meta["region"],
                "league": league,
                "logo": "teams/%s.webp" % meta["short"].lower(),
            }
        )

    for team in new_teams:
        print("+ equipe %-4s %s (%s)" % (team["short"], team["name"], team["league"]))
        logo, fresh = fetch_image(logo_files[team["name"]], 80, team["logo"])
        if logo is None:
            team["color"] = dominant_color(Image.new("RGBA", (1, 1)))
            continue
        logo.thumbnail((80, 80), Image.LANCZOS)
        team["color"] = dominant_color(logo)
        if fresh and not DRY:
            logo.save(os.path.join(PUBLIC, team["logo"]), "WEBP", quality=90)

    all_teams = data["teams"] + new_teams
    short_by_name = {team["name"]: team["short"] for team in all_teams}
    league_by_short = {team["short"]: team["league"] for team in all_teams}
    region_by_short = {team["short"]: team["region"] for team in all_teams}

    wanted = {}
    for name, members in roster.items():
        short = short_by_name.get(name)
        if not short:
            continue
        for link, row in members.items():
            wanted[(short, display_name(row["player"]).lower())] = (short, link, row)

    removed = [p for key, p in known_players.items() if key[0] in {s for s, _ in wanted} and key not in wanted]
    for player in removed:
        print("- joueur retire (hors roster) : %s %s" % (player["team"], player["name"]))

    added = [value for key, value in wanted.items() if key not in known_players]
    infos, images = {}, {}
    if added:
        links = [link for _, link, _ in added]
        for row in cargo(
            tables="Players",
            fields="Players.OverviewPage=link,Players.Country=country",
            where="Players.OverviewPage IN (%s)" % quote(links),
        ):
            infos[row["link"].lower()] = row.get("country") or "—"
        for row in cargo(
            tables="PlayerImages=PI,Tournaments=T",
            join_on="PI.Tournament=T.OverviewPage",
            fields="PI.Link=link,PI.FileName=file,T.DateStart=date",
            where="PI.Link IN (%s)" % quote(links),
            order_by="T.DateStart DESC",
        ):
            key = row["link"].lower().replace(" ", "")
            if key not in images and row.get("date"):
                images[key] = row["file"]

    new_players = []
    for short, link, row in added:
        name = display_name(row["player"])
        identifier = "%s-%s" % (short, name)
        entry = {
            "id": identifier,
            "name": name,
            "team": short,
            "league": league_by_short[short],
            "region": region_by_short[short],
            "role": ROLES[row["role"]],
            "country": infos.get(link.lower(), "—"),
            "image": None,
        }
        filename = images.get(link.lower().replace(" ", ""))
        relative = "players/%s.webp" % slug(identifier)
        if filename or os.path.exists(os.path.join(PUBLIC, relative)):
            photo, fresh = fetch_image(filename, 220, relative)
            if fresh and not DRY:
                photo.save(os.path.join(PUBLIC, relative), "WEBP", quality=85)
            if photo is not None:
                entry["image"] = relative
        else:
            print("! pas de photo pour %s" % identifier)
        print("+ joueur %-14s %-7s %-12s %s" % (identifier, entry["role"], entry["country"], filename))
        new_players.append(entry)
        time.sleep(0.15)

    removed_ids = {p["id"] for p in removed}
    players = [p for p in data["players"] if p["id"] not in removed_ids] + new_players
    players.sort(key=lambda p: (p["team"], ROLE_ORDER.index(p["role"])))

    data["teams"] = all_teams
    data["players"] = players
    data["updated"] = time.strftime("%Y-%m-%d")
    data["note"] = "Equipes qualifiees a la date de collecte. La qualification n est pas terminee."

    print("\n%d equipes, %d joueurs (+%d / -%d)" % (len(all_teams), len(players), len(new_players), len(removed)))
    if DRY:
        print("dry-run : rien d ecrit")
        return
    with open(PLAYERS_JSON, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
