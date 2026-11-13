# Personal website — Long Hoang

Static personal website (no build step), deployed to GitHub Pages by
`.github/workflows/static.yml` on every push to `main`.

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
Actions**. If the repository is named `<username>.github.io`, the site is
served at `https://<username>.github.io/`; any other name serves it at
`https://<username>.github.io/<repo-name>/`.
