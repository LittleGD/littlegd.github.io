# Moraro web fonts

These files derive from the fonts already used by the Moraro app. They add no new
typeface design. The source app files are not modified.

| Web file | Source | Internal family | Weight | Bytes |
| --- | --- | --- | --- | ---: |
| `changwon.woff2` | ChangwonDangamRound.otf | ChangwonDangamRound | 400 | 270,376 |
| `kosugi-maru.woff2` | KosugiMaru-Regular.ttf | Kosugi Maru | 400 | 39,180 |
| `pretendard-regular.woff2` | Pretendard-Regular.otf | Moraro Web UI | 400 | 34,412 |
| `pretendard-semibold.woff2` | Pretendard-SemiBold.otf | Moraro Web UI | 600 | 34,520 |
| `pretendard-jp-regular.woff2` | PretendardJP-Regular.otf | Moraro Web UI JP | 400 | 43,436 |
| `pretendard-jp-semibold.woff2` | PretendardJP-SemiBold.otf | Moraro Web UI JP | 600 | 44,024 |

The full original six files total 15,926,120 bytes; full WOFF2 versions would total
8,253,744 bytes. The delivered set totals 465,948 bytes. The manifest is the source
of truth after regeneration; a text change can change these byte counts.

## Coverage and loading

Changwon is a full font. Other files include all printable ASCII, common quotation
marks/dashes/ellipsis, all three language-menu labels, and the current landing
page's visible text plus alt/title/aria-label attributes. The non-Japanese body
files combine the EN and KO pages. JP files use the JA page. Script/style source
and JSON-LD are excluded from text selection.

All retained glyph outlines and advances are compared against the original after
writing WOFF2. Layout features for retained glyphs, original authorship, copyright and license metadata
are preserved. `font-manifest.json` records input/output SHA-256, page hashes,
coverage, and verification results. The names of the four OFL body subsets have
been changed to avoid Reserved Font Names. They remain under SIL OFL 1.1.

Use Changwon for EN/KO headings and the lowercase `moraro` logo in every locale.
Use Kosugi Maru for JA headings. Use Moraro Web UI for EN/KO body and 600-weight
buttons; use Moraro Web UI JP for JA body and buttons. Set `font-display: swap`.
Only preload the active locale's heading font when that is beneficial; do not
preload all six files. Defining a font face does not itself require using it.

**Language-label fallback:** The original non-Japanese Pretendard has no glyphs for
`日本語`. Apply the JP body family to the menu's `[lang="ja"]` label (43,436 bytes, about 43.4 KB for the regular weight),
or include that family in its fallback stack. The JP body font covers `한국어`.
Kosugi has no Hangul, ©, or long dash in the original; menu labels and footer text
use body fonts. Do not force every language label into a heading font.

Example declarations to merge into the site's own stylesheet:

```css
@font-face {
  font-family: "Moraro Display";
  src: url("/moraro/assets/fonts/changwon.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Moraro Display JP";
  src: url("/moraro/assets/fonts/kosugi-maru.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Moraro Web UI";
  src: url("/moraro/assets/fonts/pretendard-regular.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Moraro Web UI";
  src: url("/moraro/assets/fonts/pretendard-semibold.woff2") format("woff2");
  font-style: normal;
  font-weight: 600;
  font-display: swap;
}
@font-face {
  font-family: "Moraro Web UI JP";
  src: url("/moraro/assets/fonts/pretendard-jp-regular.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Moraro Web UI JP";
  src: url("/moraro/assets/fonts/pretendard-jp-semibold.woff2") format("woff2");
  font-style: normal;
  font-weight: 600;
  font-display: swap;
}
```

## Sources and licenses

- ChangwonDangamRound: copyright Changwon Special City; made by ttseoul.
  See `ChangwonDangamRound-PERMISSION.txt` for source and usage permission.
  It is compressed intact, not subset or redrawn.
- Kosugi Maru: Copyright 2010 The Kosugi Maru Project Authors
  (https://github.com/googlefonts/kosugi-maru), original font designer MOTOYA.
  Apache License 2.0; exact license text is `KosugiMaru-LICENSE.txt`.
  Source: https://github.com/googlefonts/kosugi-maru.
- Pretendard / Pretendard JP: Copyright © 2023 Kil Hyung-jin in the app font
  metadata; the accompanying upstream license also credits Kil Hyung-jin,
  Adobe, the Inter Project Authors and the M+ FONTS Project Authors.
  SIL Open Font License 1.1; exact copyright and license text is
  `Pretendard-LICENSE.txt`. Source: https://github.com/orioncactus/pretendard.
  This website's subsets are named Moraro Web UI and Moraro Web UI JP internally.

Changes made 2026-10-17: WOFF2 compression of the complete Changwon font; glyph
subsetting and WOFF2 conversion for the other five files; internal family/full/
PostScript name replacement in the four OFL subsets; stale DSIG table removed by
fontTools where present. No retained glyph outlines or advance widths changed.
These derivative files are not endorsed by the original authors.

## Regeneration

Rerun after changes to any landing page's displayed copy or accessible labels.
The app source fonts must be available; original font files are deliberately not
duplicated in this website repository.

```sh
python3 -m pip install 'fonttools[woff]' brotli
python3 moraro/assets/fonts/build-fonts.py \
  --source-fonts /path/to/MoraroOcean/Resources/Fonts \
  --site-root /path/to/littlegd.github.io
```

Do not copy these page-specific subsets to arbitrary app screens or documents.
For new strings outside the recorded pages, regenerate or use an appropriate
complete font. Check `missing_from_original` in the manifest: it distinguishes
characters never present in the source font from actual subset omissions.
