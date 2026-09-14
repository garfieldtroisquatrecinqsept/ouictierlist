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

## Développement

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
