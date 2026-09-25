# Andrew Blayama Stephen — Portfolio

Static site for GitHub Pages. No build step.

```
index.html        Intro: hero, profile, capabilities, experience, toolkit, news, education, contact
research.html     Research themes, publications (with copy-citation), ongoing work, talks
projects.html     Filterable project case studies + featured malaria project
assets/css/style.css
assets/js/main.js  Theme toggle, copy buttons, project filters, microscope illustration
assets/andrew.jpg
assets/Andrew_Stephen_Resume.pdf
assets/favicon.svg
```

## Deploy
1. Copy everything in this folder into the root of the `blayama.github.io` repo (replace the old `index.html`).
2. Commit and push to `main`. GitHub Pages republishes in a minute or two.

## Updating
- New paper: copy a `<li class="pub">` block in `research.html`.
- New project: copy an `<article class="card">` block in `projects.html`; set `data-cat` to one or more of `bi survey gov ml`. Filter counts update automatically.
- Add a GitHub/dashboard link to a card: `<div class="links"><a class="chip-link" href="URL" target="_blank" rel="noopener">Code</a></div>`
- New CV: replace `assets/Andrew_Stephen_Resume.pdf` (keep the filename).
