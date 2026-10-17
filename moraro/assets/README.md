# Moraro website assets

These assets come from the existing **MoraroOcean** app repository. Product screenshots and icon exports preserve the source composition and product UI, with proportional resizing and compression only. The separate social-sharing artwork below was generated from the official App Store header and is not an app screenshot.

## Sources and exports

| Web asset | Original in MoraroOcean | Output size |
| --- | --- | --- |
| `moraro-share-v1.png` | `docs/store-art/share/moraro-share-header-v1.png`, generated from the official v5 App Store header | 1730 × 909, PNG, copied unchanged |
| `hero-boat.webp` | `Moraro_icon.icon/Assets/Moraro-icon5.png` | 1254 × 1254, transparent, 83,566 bytes |
| `{en,ko,ja}/03-lookup.webp` | `docs/store-screenshots/2026-10-07/iphone-6.9/{en,ko,ja}/03-lookup.png` | 960 × 2086 |
| `{en,ko,ja}/06-scrapbook.webp` | Same locale directory, `06-scrapbook.png` | 960 × 2086 |
| `{en,ko,ja}/07-review.webp` | Same locale directory, `07-review.png` | 960 × 2086 |
| Inline arrow in all three landing pages | `scripts/icons/arrow-right.svg` | Official Tide path data embedded unchanged; no separate file |
| `fonts/` | App heading and body fonts | See `fonts/README.md` and `fonts/font-manifest.json` |

Source screenshots are actual simulator app captures, as documented in `docs/store-screenshots/2026-10-07/README.md`. Korean and Japanese interfaces show English learning; the English interface shows Korean learning. The complete screenshots retain their original App Store headings and device framing. The page may reveal the phone area with CSS without changing screenshot content.

The current flattened public app icon remains at `/assets/moraro-icon-512.jpg`. The app source for its porcelain boat is `Moraro_icon.icon/Assets/Moraro-icon5.png`; the older dotted-M AppIcon asset is not used. Unused full-ocean header exports, listening screenshots and standalone SVG files were moved outside the website checkout to the task workspace's `research/unused-assets-oku/`, with their provenance preserved there.

## Optimization

Exported 2026-10-17 with local `cwebp`. The precise tool version, all source/output SHA-256 hashes and byte sizes are recorded in `asset-provenance.json`.

```sh
cwebp -quiet -q 85 -m 6 -resize 960 0 SOURCE.png -o OUTPUT.webp
```

The 10 current WebP files total 1,636,654 bytes. Each locale only needs its own three screenshots. Explicit image dimensions should be set in HTML to reserve space; below-the-fold screenshots should use lazy loading.

The transparent `hero-boat.webp` was added for the local Oku-reference direction. It uses compression only, preserving the full 1254 × 1254 original canvas and an identical alpha channel:

```sh
cwebp -quiet -q 90 -m 6 -alpha_q 100 -exact Moraro-icon5.png -o hero-boat.webp
```

Its main visible boat region is approximately `x:313 y:415 width:692 height:602` (alpha ≥ 8). The original deliberately has large transparent margins for icon composition. Position and size it in CSS to give the boat the intended visual scale. The asset includes its original subtle blue shadow/reflection; no ocean background, pool, waves, or other pixels were added. This independent boat is preferred over the full-ocean header for the current white-canvas hero direction.

The source screenshot dimensions are 1320 × 2868. In source coordinates, the screen is `x:190 y:724 width:940 height:2042`; the device's outer frame is `x:177 y:711 width:966 height:2068`. Coordinates come from the original `scripts/store-screenshots/compose.py`. Scaling is proportional; the 960px export rounds its height to 2086px.

## Icons and identity

The inline arrow is from Moraro's own **Tide** set, governed by the app's `docs/ICONS.md`, `docs/ICON-STYLE.md`, and `docs/ICON-MOTION.md`. It retains the approved 24 × 24 coordinate system, 2-unit round stroke, and `currentColor`. Both source `path` values were verified unchanged in EN/KO/JA landing pages. Its source hash is recorded under `inlineSources` in the manifest. No standalone icon files remain in this directory.

Decorative icons should be hidden from assistive technology; functional icon controls need visible or accessible labels. A reduced-motion preference should retain the resting SVG shapes. The original icon source files were not edited.

## Social sharing

The EN, KO and JA landing pages use `moraro-share-v1.png` for `og:image` and `twitter:image`, with matching dimensions and localized alternative text. The versioned URL avoids stale copies of the previous icon preview. App Store URL previews are controlled by Apple and LinkedIn; changing this website artwork changes previews of `littlegd.github.io/moraro/` and its localized URLs. LinkedIn Post Inspector can refresh a URL for new posts; existing published cards may keep their original preview.
