# Personal website — Long Hoang

Static personal website (no build step), deployed to GitHub Pages by
`.github/workflows/static.yml` on every push to `main`.

Live at **<https://longhoang-git.github.io/>** (repository `longhoang-git/longhoang-git.github.io`).

```
.
├── index.html                      ← the site (placeholder for now)
├── styles.css                      ← (to come) styling, light and dark
├── site.js                         ← (to come) panel switching, search, dark mode
├── assets/
│   ├── CV_Long_Hoang.pdf           ← (to come) public CV — no phone, no referees
│   ├── portrait.jpg                ← (to come)
│   └── logos/                      ← UCL, HUST, SIT logos
├── .nojekyll                       ← tells Pages to serve files as they are
└── .github/workflows/static.yml    ← deploys to Pages
```

Everything in this repository is **public**. Never add cover letters, referee
details, client names or OWC project codes.

## Viewing locally

Open `index.html` in a browser.

## Deployment

Enable Pages once: **Settings → Pages → Build and deployment → Source: GitHub
Actions**. The repository must stay named `longhoang-git.github.io` for the
site to be served at `https://longhoang-git.github.io/`.
