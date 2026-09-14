# Tierlists LoL

Site statique de tierlists (LCK, LEC, LPL, LCP, Worlds, MSI).

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

Les tierlists sont stockées dans le `localStorage` du navigateur.
