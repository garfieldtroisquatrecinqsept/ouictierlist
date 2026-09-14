"""Collecte le palmares de chaque joueur sur Leaguepedia (Cargo).

Usage : python scripts/collect_palmares.py
Ne garde que les finales : titre (1) ou finaliste (2).
Ecrit src/data/palmares.json.
"""

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAYERS_JSON = os.path.join(ROOT, "src", "data", "players.json")
OUT_JSON = os.path.join(ROOT, "src", "data", "palmares.json")

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
HEADERS = {
    "User-Agent": UA,
    "Accept": "application/json,text/html;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://lol.fandom.com/wiki/Special:CargoTables",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
}

TEAM_PAGES = {
    "AL": "Anyone's Legend",
    "BLG": "Bilibili Gaming",
    "CFO": "CTBC Flying Oyster",
    "DK": "Dplus Kia",
    "G2": "G2 Esports",
    "GEN": "Gen.G",
    "HLE": "Hanwha Life Esports",
    "KC": "Karmine Corp",
    "MVK": "MVK Esports",
    "T1": "T1",
    "TSW": "Team Secret Whales",
}

MAJOR = {
    "LoL Champions Korea": "LCK",
    "LoL The Champions": "LCK",
    "Tencent LoL Pro League": "LPL",
    "LoL EMEA Championship": "LEC",
    "Europe League Championship Series": "LEC",
    "League of Legends Championship Series": "LCS",
    "League of Legends Championship Pacific": "LCP",
    "Pacific Championship Series": "PCS",
    "LoL Master Series": "LMS",
    "Vietnam Championship Series": "VCS",
    "Garena Premier League": "GPL",
    "League of Legends Championship of The Americas": "LTA",
    "League of Legends Championship of The Americas North": "LTA",
    "Turkish Championship League": "TCL",
}

MINOR = {
    "LCK Challengers League": "LCK CL",
    "Challengers Korea": "CK",
    "LoL Development League": "LDL",
    "La Ligue Francaise": "LFL",
    "La Ligue Française": "LFL",
    "EMEA Masters": "EM",
    "European Masters": "EM",
    "Europe Challenger Series": "EU CS",
    "NA Academy League": "NACL",
    "LoL Secondary Pro League": "LSPL",
}

GLOBAL = [
    (re.compile(r"^Worlds (\d{4})$"), "WORLDS", "Worlds", 10),
    (re.compile(r"^Worlds Season (\d)$"), "WORLDS", "Worlds", 10),
    (re.compile(r"^MSI (\d{4})$"), "MSI", "MSI", 11),
    (re.compile(r"^First Stand (\d{4})$"), "FS", "First Stand", 12),
    (re.compile(r"^Esports World Cup (\d{4})$"), "EWC", "EWC", 13),
    (re.compile(r"^KeSPA Cup (\d{4})$"), "CUP", "KeSPA Cup", 14),
    (re.compile(r"^Demacia Cup (\d{4})$"), "DC", "Demacia Cup", 15),
    (re.compile(r"^Asian Games (\d{4})$"), "AG", "Asian Games", 16),
]

WORLDS_SEASON_YEAR = {"1": "2011", "2": "2012", "3": "2013"}

SKIP_NAME = re.compile(
    r"Qualifying Series|Qualifier|Promotion|Relegation|Play-?In|Preseason|Showmatch",
    re.IGNORECASE,
)


def cargo(**params):
    params.setdefault("format", "json")
    params.setdefault("limit", "500")
    params["title"] = "Special:CargoExport"
    url = "https://lol.fandom.com/index.php?" + urllib.parse.urlencode(params)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(
                urllib.request.Request(url, headers=HEADERS), timeout=60
            ) as response:
                body = response.read().decode("utf-8")
            return json.loads(body)
        except Exception as error:
            if attempt == 3:
                raise
            print("  retry (%s)" % error, file=sys.stderr)
            time.sleep(2 + attempt * 2)
    return []


def resolve_links(players):
    ids = sorted({player["name"] for player in players})
    quoted = ",".join("'" + name.replace("'", "\\'") + "'" for name in ids)
    rows = cargo(
        tables="Players",
        fields="Players.OverviewPage=link,Players.ID=id,Players.Team=team",
        where="Players.ID IN (%s)" % quoted,
    )
    links = {}
    missing = []
    for player in players:
        team_page = TEAM_PAGES.get(player["team"])
        match = None
        for row in rows:
            if (row.get("id") or "").lower() != player["name"].lower():
                continue
            if row.get("team") == team_page:
                match = row
                break
            if match is None and row.get("team") is None:
                match = row
        if match is None:
            missing.append(player["id"])
        else:
            links[player["id"]] = match["link"]
    if missing:
        print("Joueurs non resolus : %s" % ", ".join(missing), file=sys.stderr)
    return links


def history(link):
    return [
        row
        for row in cargo(
            tables="TournamentPlayers=TP,TournamentResults=TR,Tournaments=T",
            join_on="TP.PageAndTeam=TR.PageAndTeam,TR.OverviewPage=T.OverviewPage",
            fields=(
                "T.League=league,T.Year=year,T.Split=split,T.Name=name,"
                "T.TournamentLevel=level,T.IsPlayoffs=playoffs,T.IsQualifier=qual,"
                "TR.Place=place"
            ),
            where="TP.Link='%s'" % link.replace("'", "\\'"),
        )
        if row.get("name")
    ]


def split_label(name, league, short):
    year = re.search(r"\b(?:19|20)\d{2}\b", name)
    if year:
        label = name[year.end():].strip() or name[: year.start()]
    else:
        label = name
    label = re.sub(r"\bPlayoffs\b", " ", label, flags=re.IGNORECASE)
    label = re.sub(r"^\s*%s\s*" % re.escape(league), " ", label, flags=re.IGNORECASE)
    label = re.sub(r"^\s*%s\s*" % re.escape(short), " ", label, flags=re.IGNORECASE)
    label = re.sub(r"^\s*(EU LCS|NA LCS|LCS EU|LCS NA|Champions)\b\s*", " ", label, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", label).strip()


def place_of(row):
    try:
        return int(str(row.get("place")))
    except (TypeError, ValueError):
        return 0


def build(rows):
    sections = {}
    order = {}
    seen = {}

    def add(code, label, rank, year, split, place):
        if place not in (1, 2) or not year:
            return
        key = (code, str(year), split)
        if key in seen:
            return
        seen[key] = True
        sections.setdefault(code, {"code": code, "label": label, "lines": []})
        order[code] = rank
        sections[code]["lines"].append(
            {"y": str(year)[2:], "t": split, "w": place, "_sort": "%s|%s" % (year, split)}
        )

    handled = set()
    for row in rows:
        for pattern, code, label, rank in GLOBAL:
            match = pattern.match(row["name"])
            if not match:
                continue
            handled.add(row["name"])
            if row.get("level") == "Showmatch":
                break
            if pattern.pattern.startswith("^Worlds Season"):
                year = WORLDS_SEASON_YEAR.get(match.group(1))
            else:
                year = match.group(1)
            same = [x for x in rows if x["name"] == row["name"]]
            best = next((x for x in same if str(x.get("playoffs")) == "1"), same[0])
            add(code, label, rank, year, "", place_of(best))
            break

    groups = {}
    for row in rows:
        if row["name"] in handled or not row.get("league") or not row.get("year"):
            continue
        if str(row.get("qual")) == "1" or row.get("level") == "Showmatch":
            continue
        if SKIP_NAME.search(row["name"]):
            continue
        code = MAJOR.get(row["league"]) or MINOR.get(row["league"])
        if not code:
            continue
        if row["league"] in MINOR and row.get("level") == "Primary":
            continue
        key = (code, row["year"], row.get("split") or "")
        current = groups.get(key)
        if current is None or (
            str(row.get("playoffs")) == "1" and str(current.get("playoffs")) != "1"
        ):
            groups[key] = row

    for row in groups.values():
        code = MAJOR.get(row["league"]) or MINOR.get(row["league"])
        add(
            code,
            code,
            1 if row["league"] in MAJOR else 20,
            row["year"],
            split_label(row["name"], row["league"], code),
            place_of(row),
        )

    result = []
    for code, section in sections.items():
        section["lines"].sort(key=lambda line: line["_sort"])
        for line in section["lines"]:
            del line["_sort"]
        result.append((order[code], code, section))
    result.sort(key=lambda item: (item[0], item[1]))
    return [section for _, _, section in result]


def main():
    data = json.load(open(PLAYERS_JSON, encoding="utf-8"))
    players = data["players"]
    print("Resolution des pages Leaguepedia...")
    links = resolve_links(players)

    out = {}
    for index, player in enumerate(players, 1):
        link = links.get(player["id"])
        if not link:
            out[player["id"]] = []
            continue
        print("[%2d/%d] %s (%s)" % (index, len(players), player["id"], link))
        out[player["id"]] = build(history(link))
        time.sleep(0.2)

    payload = {
        "source": "https://lol.fandom.com/ (Cargo : TournamentPlayers + TournamentResults)",
        "updated": time.strftime("%Y-%m-%d"),
        "note": "Uniquement les finales : 1 = titre, 2 = finaliste.",
        "players": out,
    }
    with open(OUT_JSON, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=1)
    empty = [key for key, value in out.items() if not value]
    print("Ecrit %s (%d joueurs, %d sans palmares)" % (OUT_JSON, len(out), len(empty)))
    if empty:
        print("Sans palmares : %s" % ", ".join(empty))


if __name__ == "__main__":
    main()
