# Tierlists LoL

Site statique de tierlists (LCK, LEC, LPL, LCP, Worlds, MSI).

## Stack

React + TypeScript + Vite, `react-router-dom` (HashRouter), Tailwind CSS v4 et framer-motion
pour le plateau de tierlist. Le reste de l'habillage est en CSS maison dans `src/index.css`.

Les tierlists sont stockées dans le `localStorage` du navigateur.

## Logo RaphCorp

Deux fichiers à déposer dans `public/` :

| Fichier | Contenu attendu |
| --- | --- |
| `public/raphcorp-light.png` | logo **sombre** (panda noir), affiché en mode jour |
| `public/raphcorp-dark.png` | logo **clair** (panda blanc), affiché en mode nuit |

Fond transparent de préférence. Tant qu'un fichier manque, le site retombe automatiquement
sur le texte « RaphCorp » à sa place, sans rien casser.

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
