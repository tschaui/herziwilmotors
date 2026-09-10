# Herziwil Motors

Static website for **Herziwil Motors**, an oldtimer (classic/vintage car) garage in Hersiwil, Switzerland.

## Live

https://tschaui.github.io/herziwilmotors/

The site is deployed via **GitHub Pages**. Any change pushed to the `main` branch is deployed automatically.

## Tech Stack

- Plain **HTML5**, **CSS3**, and **vanilla JavaScript** — no frameworks, no build tools, no package manager
- Self-hosted assets (no CDN requests)

## Features

- **Bilingual (German default, English)** — every translatable element has both a `data-lang="de"` and `data-lang="en"` variant; the `<html>` tag carries a `data-lang` attribute and CSS hides the inactive language. The choice is persisted in `localStorage` under the key `hm-lang`.
- **Fully responsive** — mobile navigation with animated hamburger menu (<860 px), fluid typography via `clamp()`, `100svh` hero, 44 px touch targets, and breakpoint-specific grids (≤768 px / ≤480 px).
- **Accessibility** — `aria` attributes on the nav controls, `prefers-reduced-motion` support, active nav link highlighting via scroll-spy.

## Design

- **Color palette** (CSS custom properties in `css/style.css`):

  | Token | Hex |
  |---|---|
  | `--dark-olive` | `#23211E` |
  | `--sage-grey` | `#A9A193` |
  | `--warm-tan` | `#B33A2B` |
  | `--cream` | `#F1E8D8` |
  | `--ember` | `#CE5F48` |
  | `--brass` | `#C7A252` |

- **Fonts** — [Oswald](https://fonts.google.com/specimen/Oswald) (variable, weight 400–700, SIL OFL) is self-hosted in `fonts/` and used for headings; body text uses Georgia.

## Images

License-free stock images (Pexels) plus one Wikimedia Commons photo. The Pontiac Trans Am (1973) in the gallery is under CC BY-SA and carries a footer credit.

## Project Structure

```
.
├── index.html        # Single-page site (bilingual)
├── css/style.css     # All styles incl. language switching + responsive rules
├── js/main.js        # Language toggle, mobile menu, scroll-spy
├── fonts/            # Self-hosted Oswald (variable woff2)
├── images/           # Hero, about, gallery images
└── AGENTS.md         # Agent instructions (conventions, i18n, palette)
```

## Local Dev

No dev server required — open `index.html` directly in a browser, or serve the folder, e.g.:

```
python -m http.server
```

## Deploy

Everything lives in the git repo `https://github.com/tschaui/herziwilmotors`. Changes are pushed with `git push`; GitHub Pages builds and serves the site automatically.

## Contact

- Email: info@herziwilmotors.ch
- Address and phone are intentionally not published.