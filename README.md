# Blue Hour Coffee

A modern marketing site for **Blue Hour Coffee** — a design-forward coffee bar on
Milwaukee's east side. *Come early. Stay late.*

Bold editorial layout: a giant grotesque wordmark, Fraunces serif accents, a
two-tone cobalt-on-cream palette, a full-bleed marquee, and a rule-divided menu
schedule. Built as a single, self-contained `index.html` — no build step, no
photos (all visuals are CSS/SVG).

## Run it locally

```bash
node serve.mjs
# → http://localhost:3000
```

`serve.mjs` is a tiny zero-dependency static file server that serves the project
root. Any static host works just as well — open `index.html` through a server
(not `file://`, so the fonts and fetches resolve cleanly).

## Stack

- Plain HTML + CSS + vanilla JS (no framework, no dependencies)
- Type: [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) via Google Fonts
- Mobile-first responsive, with scroll-reveal animations and a live open/closed indicator

## Details

- **Hours:** Mon–Fri 7am–8pm · Sat–Sun 8am–8pm
- **Where:** 2410 N Murray Ave, Milwaukee, WI 53211
- **Hello:** info@bluehour.coffee
