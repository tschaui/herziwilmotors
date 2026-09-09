# Herziwil Motors — Agent Instructions

## Project

Static webpage for Herziwil Motors, an oldtimer (classic/vintage car) garage in Hersiwil, Switzerland. Plain HTML, CSS, and vanilla JavaScript — no frameworks, no build tools, no package manager.

## Contact

- Email: info@herziwilmotors.ch (no address or phone on the site — contact info is anonymized)

## i18n

The site is bilingual (German default, English). Mechanism:

- Every element needing translation carries both a `data-lang="de"` and `data-lang="en"` variant (siblings).
- The `<html>` tag has a `data-lang` attribute; CSS in `css/style.css` hides the inactive language via `html[data-lang="de"] [data-lang="en"] { display: none; }` and vice versa.
- The toggle button in the nav shows the language you can switch TO (e.g. "EN" in German view).
- `html` must ALWAYS have `data-lang="de"` in the source so content renders correctly before JS runs (no-JS fallback is German).
- `js/main.js` sets `data-lang`, persists the choice in `localStorage` under key `hm-lang`, and defaults to German.

When adding new content, always provide both language variants.

## Color Palette

All colors are defined as CSS custom properties in `css/style.css`:

| Token | Hex | Usage |
|---|---|---|
| `--dark-olive` | `#3E3F29` | Primary dark, backgrounds, text |
| `--sage-grey` | `#7D8D86` | Secondary/muted, borders, subtle fills |
| `--warm-tan` | `#BCA88D` | Accent, headings, CTAs |
| `--cream` | `#F1F0E4` | Light background, body text on dark |

Always reference variables (`var(--dark-olive)`) instead of raw hex values.

## Conventions

- Files go in the repo root or obvious subdirectories (`css/`, `js/`, `images/`, `fonts/`).
- No bundler — changes are immediately viewable by opening `index.html` in a browser.
- Keep things simple: semantic HTML, minimal JS, responsive CSS.
- Prefer native web APIs over libraries.
- Fonts are self-hosted in `fonts/` (no external CDN requests): Oswald (variable, weight 400–700, SIL OFL) is the heading font via `--font-heading`; body text uses `--font-main` (Georgia).

## Gotchas

- There is no dev server or hot reload — open files directly in a browser or use a simple local server (e.g. `python -m http.server`).
- No linting or typechecking is configured yet. If added later, run it before committing.
- Images should be optimized for web (reasonable file sizes).
- Image sources: prefer license-free stock (Pexels/Pixabay/Unsplash). Wikimedia Commons is fine but check license — CC BY-SA requires attribution (crucial: the Trans Am photo in `images/gallery1.jpg` is a 1973 model with hood bird and needs the footer credit).
- Downloading via `Invoke-WebRequest` from Wikimedia `upload.wikimedia.org` is easily rate-limited (HTTP 429); use `https://commons.wikimedia.org/wiki/Special:FilePath/<filename>` with `-MaximumRedirection 5` instead.
