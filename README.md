# Personal website — Long Hoang

A static, dependency-free personal website. No build step and no framework:
one HTML file, one stylesheet, one script, deployed to GitHub Pages by a
workflow.

Live at **<https://longhoang-git.github.io/>** (repository `longhoang-git/longhoang-git.github.io`).

```
.
├── index.html      ← the whole site: top bar, sidebar, and all five panels
├── styles.css      ← all styling, light and dark themes
├── site.js         ← all behaviour, read from the markup in index.html
├── assets/
│   ├── CV_Long_Hoang.pdf           ← (to come) public CV — no phone, no referees
│   ├── portrait.jpg                ← profile photo, 4:5
│   └── logos/                      ← (empty for now)
├── .nojekyll                       ← tells Pages to serve files as they are
└── .github/workflows/static.yml    ← deploys to GitHub Pages on push to main
```

Everything in this repository is **public**. Never add cover letters, phone
number, referee details, client names or OWC project codes.

## How it works

The site is a single page with five panels — About, Experience, Projects,
Research, CV. The top bar switches between them: only the selected panel is
shown, and the page does not scroll from one section to the next.

Each panel is a `<section data-panel="…">` inside `<main>`. The URL hash tracks
the open panel (`#projects`), so links to a specific panel work and the back
button steps through them. The hash deliberately does not match any element
`id` — that is what stops the browser from scrolling the page on load.

A sub-route after a slash is handed to the panel: `#projects/cables` opens
Projects filtered to cable systems.

### Interactive pieces

Everything below is built by `site.js` from the HTML, so editing `index.html`
is enough.

- **Search palette** — `Ctrl K` / `⌘ K` or `/` opens it. It indexes every
  project, role, paper and About row on the page, plus a few actions (copy
  email, open CV, LinkedIn, dark mode).
- **Keyboard** — `←` / `→` step through the panels, `1`–`5` jump to one.
- **Dark mode** — the moon button. Light is the default; the choice is
  remembered in the visitor's browser.
- **Project filters** — topic chips and a keyword box (see *Add a project*).
- **Experience span chart** — the bars at the top of Experience, drawn from the
  timeline entries below it (see *Add a role*).

## Editing the site

Everything lives in `index.html`, in clearly marked sections. Take wording from
`cv/master-content.md` in the job-application folder, so the CV and the site agree.

**Add a project.** Copy an `<article class="card">…</article>` block in the
Projects panel:

```html
<article class="card" data-topics="cables studies">
  <div class="card-meta"><span class="status">FEED</span>Electrical engineer</div>
  <h3 class="card-title">Descriptive project name (no client names or codes)</h3>
  <p class="card-text">One or two lines on what was done.</p>
</article>
```

`data-topics` is space-separated; each word matches a filter chip's
`data-topic`. Sector chips: `selected` (on the CV), `offshore`, `onshore`,
`solar`, `interconnector`, `hydrogen`. Work chips: `leadership`, `cables`,
`studies`, `econ`, `markets`, `policy`, `software`. To add
a topic, add a chip:
`<button class="chip" type="button" data-topic="hvdc" aria-pressed="false">HVDC</button>`.
Counts on the chips are filled in automatically.

**Add a paper.** Copy a `<div class="paper">…</div>` block inside the relevant
`<div class="group">` of the Research panel:

```html
<div class="paper">
  <div class="paper-title">Title of the paper</div>
  <div class="paper-authors"><strong>Long HH</strong>, Anh NH, and Tuyen ND</div>
  <div class="paper-meta"><span class="status">Under review</span><em>Journal name</em> (Q1), 2026</div>
</div>
```

The `<span class="status">` badge is optional — drop it for published work.

**Add a role.** Copy an `<div class="entry">` block in the Experience panel,
keeping the timeline newest first:

```html
<div class="entry" data-kind="industry" data-from="2027" data-to="present" data-short="Role · Company">
  <div class="when"><span class="date">2027 — Present</span><span class="kind industry">Industry</span></div>
  <div>
    <div class="what">Role title</div>
    <div class="where">Company, location</div>
    <ul class="detail"><li>What was done.</li></ul>
  </div>
</div>
```

`data-kind` is `industry` or `research`; `data-from` / `data-to` are years
(`present` means this year) and place the bar in the span chart; `data-short`
is the bar's label.

**Add a panel.** Add a `<li><a href="#name" data-nav="name">Name</a></li>` to
the top bar and a matching `<section id="panel-name" data-panel="name">` in
`<main>`. The switching script picks it up automatically.

**After changing styles.css or site.js.** Change the `?v=…` date on the two
links in `index.html` (`styles.css?v=2026-11-13`, `site.js?v=2026-11-13`) to
today's date, so visitors' browsers load the new file instead of a cached copy.

**Update the CV.** Put the public CV at `assets/CV_Long_Hoang.pdf`, keeping the
filename, and update the "Last updated" line in the CV panel. Once the file
exists, uncomment the `<iframe class="pdf-frame">` there to show it in the page.

**Change the photo.** The portrait is `assets/portrait.jpg` (4:5, 760 × 950 px,
JPG). To change it: crop the new photo to 4:5 (portrait), save it as JPG,
replace `assets/portrait.jpg` with the same name, then commit and push. The page
also crops to 4:5, so a slightly different ratio still works; adjust
`object-position` on `.portrait` in `styles.css` to shift the crop.

**Change the accent colour.** `--accent` at the top of `styles.css` (navy
`#003366`, as on the CV), and its dark-theme counterpart under
`:root[data-theme="dark"]` just below. `--research` is the second hue used for
research entries on the Experience timeline.

## Viewing it locally

Open `index.html` in a browser — it works straight from disk, no server needed.
Or serve the folder: `python -m http.server 8000` and open
<http://localhost:8000/>.

## Deployment

`.github/workflows/static.yml` publishes the repository root to GitHub Pages on
every push to `main`.

Enable Pages once: **Settings → Pages → Build and deployment → Source: GitHub
Actions**. The repository must stay named `longhoang-git.github.io` for the
site to be served at `https://longhoang-git.github.io/`. Every path in the site
is relative, so it also works from a project sub-path.
