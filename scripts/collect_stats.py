"""Collecte les statistiques individuelles des joueurs sur gol.gg.

Usage : python scripts/collect_stats.py [saison]
Par defaut la saison S16 (2026), tous splits et tous tournois.
Ecrit src/data/stats.json et telecharge les icones de champions manquantes
dans public/champions/.
"""

import html
import json
import os
import re
import sys
import time
import urllib.request
from html.parser import HTMLParser

SEASON = sys.argv[1] if len(sys.argv) > 1 else "S16"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAYERS_JSON = os.path.join(ROOT, "src", "data", "players.json")
STATS_JSON = os.path.join(ROOT, "src", "data", "stats.json")
ICON_DIR = os.path.join(ROOT, "public", "champions")

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

BLOCKS = {
    "general": ("general stats", {
        "record": "Record",
        "winrate": "Win Rate",
        "kda": "KDA",
        "csPerMin": "CS per Minute",
        "goldPerMin": "Gold Per Minute",
        "goldShare": "Gold%",
        "killParticipation": "Kill Participation",
    }),
    "earlyGame": ("early game", {
        "csDiff15": "CS Differential at 15 min",
        "goldDiff15": "Gold Differential at 15 min",
        "xpDiff15": "XP Differential at 15 min",
        "aheadInCs15": "Ahead in CS at 15 min",
        "firstBloodParticipation": "First Blood Participation",
        "firstBloodVictim": "First Blood Victim",
    }),
    "aggression": ("aggression", {
        "damagePerMin": "Damage Per Minute",
        "damageShare": "Damage%",
        "kaPerMin": "K+A Per Minute",
        "soloKills": "Solo kills",
        "pentakills": "Pentakills",
    }),
    "vision": ("vision", {
        "visionScorePerMin": "Vision score Per Minute",
        "wardsPerMin": "Ward Per Minute",
        "controlWardsPerMin": "Vision Ward Per Minute",
        "wardsClearedPerMin": "Ward Cleared Per Minute",
    }),
}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://gol.gg/"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


class Tables(HTMLParser):
    """Extrait chaque table en lignes de cellules, en gerant l'imbrication."""

    def __init__(self):
        super().__init__()
        self.tables = []
        self._stack = []

    @property
    def _top(self):
        return self._stack[-1] if self._stack else None

    def handle_starttag(self, tag, attrs):
        top = self._top
        if tag == "table":
            self._stack.append({"rows": [], "row": None, "cell": None, "img": None})
        elif tag == "tr" and top:
            top["row"] = []
            top["img"] = None
        elif tag in ("td", "th") and top and top["row"] is not None:
            top["cell"] = []
        elif tag == "img" and top and top["row"] is not None and top["img"] is None:
            top["img"] = dict(attrs).get("src")

    def handle_endtag(self, tag):
        top = self._top
        if not top:
            return
        if tag == "table":
            self._close_row(top)
            self.tables.append(top["rows"])
            self._stack.pop()
        elif tag == "tr":
            self._close_row(top)
        elif tag in ("td", "th"):
            self._close_cell(top)

    def _close_cell(self, top):
        if top["cell"] is not None:
            text = re.sub(r"\s+", " ", "".join(top["cell"])).strip()
            top["row"].append(text)
            top["cell"] = None

    def _close_row(self, top):
        self._close_cell(top)
        if top["row"] is not None:
            top["rows"].append({"cells": top["row"], "img": top["img"]})
            top["row"] = None

    def handle_data(self, data):
        top = self._top
        if top and top["cell"] is not None:
            top["cell"].append(html.unescape(data))


def parse_player(page):
    parser = Tables()
    parser.feed(page)
    blocks, champions = {}, []

    for table in parser.tables:
        if not table or not table[0]["cells"]:
            continue
        head = table[0]["cells"][0].lower()

        for key, (marker, fields) in BLOCKS.items():
            if head.startswith(marker):
                kv = {}
                for row in table:
                    c = [x for x in row["cells"] if x]
                    if len(c) >= 2 and c[0].endswith(":"):
                        kv[c[0][:-1]] = c[1]
                blocks[key] = {
                    out: (None if kv.get(src) in (None, "-", "") else kv.get(src))
                    for out, src in fields.items()
                }

        if head.startswith("champion"):
            for row in table:
                c = row["cells"]
                if len(c) >= 4 and c[0] and re.fullmatch(r"\d+", c[1] or ""):
                    champions.append({
                        "name": c[0],
                        "games": int(c[1]),
                        "winrate": c[2],
                        "kda": c[3],
                        "icon": row["img"],
                    })

    return blocks, champions[:10]


def slug(name):
    return re.sub(r"[^a-z0-9]+", "", name.lower())


def main():
    players = json.load(open(PLAYERS_JSON, encoding="utf-8"))["players"]
    os.makedirs(ICON_DIR, exist_ok=True)

    print("liste des joueurs gol.gg...")
    listing = fetch(f"https://gol.gg/players/list/season-{SEASON}/split-ALL/tournament-ALL/")
    ids = {}
    pattern = r"player-stats/(\d+)/[^'\"]*['\"][^>]*>\s*([^<]+?)\s*</a>"
    for pid, label in re.findall(pattern, listing):
        ids.setdefault(re.sub(r"\s+", "", html.unescape(label)).lower(), pid)
    print(f"  {len(ids)} joueurs indexes")

    out, missing, icons = {}, [], {}
    for i, player in enumerate(players, 1):
        key = re.sub(r"\s+", "", player["name"]).lower()
        pid = ids.get(key)
        if not pid:
            missing.append(player["name"])
            continue
        url = f"https://gol.gg/players/player-stats/{pid}/season-{SEASON}/split-ALL/tournament-ALL/"
        blocks, champions = parse_player(fetch(url))
        if "general" not in blocks:
            missing.append(player["name"] + " (page illisible)")
            continue
        for champ in champions:
            if champ["icon"]:
                icons[champ["name"]] = champ["icon"]
            champ["slug"] = slug(champ["name"])
            champ.pop("icon", None)
        out[player["id"]] = {"golggId": pid, **blocks, "champions": champions}
        print(f"  {i:>2}/{len(players)} {player['name']}")
        time.sleep(0.15)

    for name, src in icons.items():
        dest = os.path.join(ICON_DIR, slug(name) + ".png")
        if os.path.exists(dest):
            continue
        url = "https://gol.gg/" + src.lstrip("./").replace("_img", "_img", 1)
        try:
            with open(dest, "wb") as f:
                f.write(fetch_bytes(url))
        except Exception as exc:
            print("  icone manquante:", name, exc)

    data = {
        "season": SEASON,
        "scope": "tous splits, tous tournois",
        "source": "https://gol.gg/",
        "players": out,
    }
    json.dump(data, open(STATS_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\n{len(out)} joueurs ecrits, {len(icons)} champions distincts")
    if missing:
        print("non rattaches:", ", ".join(missing))


def fetch_bytes(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://gol.gg/"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


if __name__ == "__main__":
    main()
