# Tierlists LoL

Site statique de tierlists (LCK, LEC, LPL, LCP, Worlds, MSI).

## Stack

React + TypeScript + Vite, `react-router-dom` (HashRouter), Tailwind CSS v4 et framer-motion
pour le plateau de tierlist. Le reste de l'habillage est en CSS maison dans `src/index.css`.

Les tierlists sont stockées dans le `localStorage` du navigateur.

## Logo RaphCorp

| Fichier | Contenu | Affiché |
| --- | --- | --- |
| `public/raphcorp-light.png` | panda noir, fond transparent | mode jour |
| `public/raphcorp-dark.png` | même dessin en luminance inversée | mode nuit |

La version nuit est générée depuis la version jour : chaque pixel non transparent voit son RVB
inversé, ce qui retourne le panda en blanc et ses marques faciales en sombre, sans toucher au
canal alpha. Pour régénérer après un changement de logo, repartir du PNG source et appliquer
la même inversion.

Si un fichier est absent, le site retombe sur le texte « RaphCorp » sans rien casser.

## Base de joueurs

`src/data/players.json` contient les equipes qualifiees pour Worlds 2026 et leurs joueurs.
Chaque joueur porte son equipe, sa **ligue** (LCK, LPL, LEC, LCP), sa region, son **poste**
(top, jungle, mid, bot, support), son pays et le chemin de sa photo.

Repartition a la collecte : LCK 20, LCP 17, LPL 12, LEC 12 joueurs ;
top 14, jungle 13, bot 12, mid 11, support 11.

A la creation d'une tierlist, le banc est pre-rempli avec les joueurs de la categorie
choisie : la ligue correspondante pour LCK, LPL, LEC et LCP, la totalite des joueurs
qualifies pour Worlds et MSI. Ils sont ranges par poste.

Les visuels sont dans `public/` :

| Dossier | Contenu |
| --- | --- |
| `public/players/` | portraits 220 px en WebP, nommes `<equipe>-<joueur>.webp` |
| `public/teams/` | logos d'equipe 80 px en WebP |
| `public/roles/` | pictos de role en deux tons de gris, suffixes `-light` et `-dark` |

Source : [Leaguepedia](https://lol.fandom.com/wiki/2026_Season_World_Championship).
L'URL d'une image du wiki se calcule sans appeler l'API : le chemin est
`images/<h0>/<h0h1>/<NomDeFichier>` ou `h` est le MD5 du nom de fichier avec les espaces
remplaces par des underscores. L'API Cargo elle-meme est fortement limitee en anonyme ;
`Special:CargoExport` ne l'est pas et rend le meme JSON.

La qualification n'etait pas terminee a la date de collecte (2026-09-14) : 11 equipes sur
une vingtaine de places. Pour completer, relancer la collecte et regenerer le JSON.

## Developpement

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Mise en ligne

Push sur `main` : le workflow `.github/workflows/deploy.yml` construit le site et le publie sur GitHub Pages.
Dans les réglages du dépôt, Settings → Pages → Source : **GitHub Actions**.

## Crédits

`src/components/TierList.tsx` vient de [Tier List Maker](https://21st.dev/@laziekiki/components/tier-list-maker)
par **laziekiki** sur 21st.dev, récupéré via le MCP 21st. Adaptations locales : suppression d'un élément
(prop `onRemoveItem`), textes en français, couleurs de tiers passées par `tierColors`, correctifs de typage
pour les callbacks de `ref` sous React 19.
