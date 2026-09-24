# Design Direction — Ambient Mac Copilot

> Generado con **Inspo MCP** + **Kreo MCP** (preset glass → evolucionado a **Liquid Glass** en `src/theme/liquid-glass.css`).

## Inspo recommend

```json
{
 "brief": "macOS ambient copilot command palette, dark translucent glass modal, productivity like Raycast or Linear, compact chat + settings",
 "filters": {
  "inferredMode": "dark"
 },
 "pick": {
  "macrostructure": {
   "slug": "bento-grid",
   "label": "Bento Grid"
  },
  "rationale": "Picked Bento Grid - most common macrostructure (4 of the top hits) among the hybrid-search results for the brief. The shortlist carries the runners-up with their exemplar counts; take one of those instead if it fits the brief better."
 },
 "shortlist": [
  {
   "slug": "bento-grid",
   "label": "Bento Grid",
   "hits": 4,
   "exemplars": 5
  },
  {
   "slug": "marquee-hero",
   "label": "Marquee Hero",
   "hits": 3,
   "exemplars": 7
  },
  {
   "slug": "portfolio-grid",
   "label": "Portfolio Grid",
   "hits": 3,
   "exemplars": 3
  }
 ],
 "evidence": {
  "sites": 24,
  "paperBand": {
   "consensus": "dark",
   "share": 0.5,
   "spread": {
    "dark": 0.5,
    "mid": 0.5
   }
  },
  "displayClass": {
   "consensus": "grotesk-sans",
   "share": 0.71,
   "spread": {
    "grotesk-sans": 0.71,
    "display-condensed-bold": 0.04,
    "geometric-sans": 0.13,
    "system-native": 0.13
   }
  },
  "accentHue": {
   "consensus": "cool",
   "share": 0.38,
   "spread": {
    "warm": 0.29,
    "chromatic-other": 0.33,
    "cool": 0.38
   }
  },
  "faces": [
   {
    "family": "Inter",
    "sites": 3
   },
   {
    "family": "Goga",
    "sites": 1
   },
   {
    "family": "National 2 Compressed",
    "sites": 1
   },
   {
    "family": "Mabry Pro",
    "sites": 1
   },
   {
    "family": "franklin-gothic-urw",
    "sites": 1
   },
   {
    "family": "Ginto Nord",
    "sites": 1
   },
   {
    "family": "Geist",
    "sites": 1
   },
   {
    "family": "Instrument Sans Variable",
    "sites": 1
   }
  ],
  "anchors": ["#ce1326", "#f7c63a", "#5333f9", "#c63325", "#cd7d32", "#fcd404", "#5f6bdc", "#a82c15"],
  "outliers": [
   {
    "slug": "juanmora-co",
    "axes": "mid / grotesk-sans / chromatic-other",
    "differsOn": ["paperBand", "accentHue"]
   },
   {
    "slug": "nordiskamuseet-se",
    "axes": "mid / grotesk-sans / warm",
    "differsOn": ["paperBand", "accentHue"]
   },
   {
    "slug": "artforum-com--features-biennials-daniel-birnbaum-1234745607",
    "axes": "mid / grotesk-sans / warm",
    "differsOn": ["paperBand", "accentHue"]
   },
   {
    "slug": "thirdmanrecords-com",
    "axes": "mid / grotesk-sans / chromatic-other",
    "differsOn": ["paperBand", "accentHue"]
   },
   {
    "slug": "basement-studio",
    "axes": "dark / geometric-sans / warm",
    "differsOn": ["displayClass", "accentHue"]
   }
  ],
  "note": "Measured over 24 sites. The category's strongest pull is display class = grotesk-sans at 71%. This is the gravity to take a position on, with it or against it - not a template to match."
 },
 "images": "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com/captures/<slug>/hero.1440.webp (also full.1440, thumb.384, mobile.384; get_screen returns exact URLs)",
 "exemplars": [
  {
   "slug": "mprez-fr",
   "title": "Agence PowerPoint : +2500 clients satisfaits | mprez",
   "northstar": "Deep indigo expanse, crisp sans-serif geometry, spacious and subtly authoritative.",
   "autopsy": "FOLD: Nav fixed top-left: logo \"mprez\" + four text links (Services, Cas clients, Agence, Ressources) + right-aligned pill \"CONTACT\" #5333f9 and \"FR\". Headline 2 lines, centered, all-caps, white, stacked: \"AGENCE POWERPOINT\" / \"POUR MARQUES INSPIRANTES\". Below: 3-line centered body, 13-14px, starts \"Chez mprez, nous accompagnons depuis 2016\". Trust badge: \"+ de 125 avis sur trustfolio\". CTA: #5333f9 rounded pill \"COMMENCER UN PROJET\" + adjacent white circle with arrow icon. Hero: dense angled collage of PowerPoint slide thumbnails, ~70% viewport, darkened with blue-black overlay; headline floats dead-center over it.\n\nTYPE: Display: ultra-compressed grotesk, extreme width contrast, all-caps, heavy. Body: clean sans, light weight, generous line-height. Scale jump: ~5:1.\n\nCOLOR: Ground near-black #0a0a0f; text white; accent #5333f9 on CTA pill and arrow circle border.\n\nSIGNATURE: The compressed grotesk headline punched white over a dimmed, chaotic bento grid of slide thumbnails - corporate order emerging from creative clutter.",
   "palette": ["#5333f9", "#735efb", "#60272f", "#9c7564", "#cccccc"],
   "fonts": ["National 2 Compressed", "Aeonik"],
   "mode": "dark",
   "macro": "bento-grid",
   "axes": "dark / display-condensed-bold / cool / National 2 Compressed",
   "tags": "minimalism, editorial, swiss, dark-mode · agency · serious, calm, technical · hero-fullbleed, logo-cloud, bento-grid, feature-trio, testimonial-wall, case-study-card, footer-compact"
  },
  {
   "slug": "thirdmanrecords-com",
   "title": "Thirdmanrecords",
   "northstar": "Warm, vintage serif whispers across a spacious, subtly textured canvas of ochre and deep umber.",
   "autopsy": "FOLD: Nav: top edge, black bar, left logo \"THIRD MAN RECORDS\" in #fcd404 caps, center links (MUSIC HARDWARE MERCH BOOKS NEWS VISIT US / TICKETS VAULT), right utility cluster (GIFT CARDS pill, $ USD dropdown, search, account, heart, cart). Hero: left 40% black panel, right 60% pale blue-gray (#86bcd6) with floating vinyl product photography. Headline \"Ted Lucas\" bold white, \"Images of Life\" lighter weight below, left-aligned, ~4 lines total. Subcopy: \"The career-spanning, 3xLP boxset of Detroit's Ted Lucas.\" CTA: #fcd404 rectangle, black text \"PRE-ORDER\". Visual: angled vinyl box set with portrait, silhouette, colored discs; overlaps both panels. Balance: text anchors left, product dominates right, diagonal energy from sleeve angles.\n\nTYPE: Display: compact sans, heavy weight, tight tracking, all-caps nav; headline sentence case, bold. Body: same family, lighter, small. Scale jump ~3:1.\n\nCOLOR: Background split black/#86bcd6. Text white on black, dark on light. Accent #fcd404 on logo, CTA, \"NEW RELEASES\" header. Thin #fcd404 rule above footer band.\n\nSIGNATURE: Asymmetric split-screen with product photography bleeding across the color boundary, creating depth against flat panels.",
   "palette": ["#fcd404", "#70550b", "#86bcd6", "#afa16d", "#c6bba9"],
   "fonts": ["Inter"],
   "mode": "dark",
   "macro": "bento-grid",
   "axes": "mid / grotesk-sans / chromatic-other (~95) / Inter",
   "tags": "minimalism, editorial, vintage, dark-mode · music, ecommerce · calm, serious, warm · hero-fullbleed, logo-cloud, feature-trio"
  },
  {
   "slug": "burb-co",
   "title": "Burb | Community Growth Tools for Creators",
   "northstar": "Deep charcoal expanse - crisp, geometric sans serif, subtle gradient depth.",
   "palette": ["#5f6bdc", "#f1b28b", "#650e0c", "#9a7155", "#abd3b2"],
   "fonts": ["Ginto Nord", "Neue Montreal"],
   "mode": "dark",
   "macro": "bento-grid",
   "axes": "mid / grotesk-sans / cool / Ginto Nord",
   "tags": "minimalism, editorial, dark-mode · creator, saas · calm, serious, technical · hero-with-cta, logo-cloud, feature-trio, stat-strip, testimonial-quote"
  },
  {
   "slug": "basement-studio",
   "title": "basement.studio | We make cool shit that performs.",
   "northstar": "Deep charcoal concrete, stark geometric type, and glowing neon accents evoke a tech-noir atmosphere.",
   "palette": ["#a82c15", "#cd8656", "#5e1408", "#91674f", "#c4c4c4"],
   "fonts": ["Geist"],
   "mode": "dark",
   "macro": "bento-grid",
   "axes": "dark / geometric-sans / warm / Geist",
   "tags": "minimalism, brutalism, monochrome, editorial, playful, futurist, dark-mode · agency, portfolio · raw, cold, technical · hero-fullbleed, logo-cloud, sticky-nav"
  },
  {
   "slug": "copilot-money",
   "title": "Copilot Money",
   "northstar": "Deep indigo expanse with playful, rounded typography floating on soft, glowing gradients.",
   "palette": ["#1c6bfb", "#0e2d66", "#6a9dfc", "#7157a1", "#bcc3d1"],
   "fonts": ["Jokker Semibold", "Jokker Medium", "sans-serif"],
   "mode": "dark",
   "macro": "bento-g
```

## Referencias clave

| Slug | Rol |
| --- | --- |
| `linear-app` | Tipografía compacta, pills, dark productivity |
| `raycast` | Command palette, glass modal, atajos |
| `bento-grid` | Macroestructura sugerida por Inspo |

## Kreo bootstrap

- `pull_registry_theme_css({ preset: "glass" })` → `src/theme/vars.css`
- `pull_registry_utils_code` → `src/lib/utils.ts`
- Componentes en `src/components/kreo/ui/`

## Token mapping

| Rol | Variable Kreo |
| --- | --- |
| Glass surface | `--card`, `--background` |
| Text | `--foreground`, `--foreground-muted` |
| Accent | `--primary`, `--accent` |
| Border | `--card-border` |
