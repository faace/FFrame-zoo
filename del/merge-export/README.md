# Merge icon review export

Current export: `review-v3`. Originals and earlier review exports are preserved. No production assets were replaced.

- Coverage: 47 ordinary items and 6 initial generators, 53 total. Upgrade parts and upgraded generator appearances are outside this batch.
- `64/`: 53 individual RGBA PNGs, each 64x64.
- `native-cells/`: full source cells, not tight object crops; 512px cells for tools/plants, approximately 313/314px for the returned 1254px sheets.
- `all-53-64px-light.png` and `all-53-64px-dark.png`: actual 64px sprites, not enlarged, arranged by chain and generator row.
- `manifest.json`: review identifiers, original source hashes/dimensions, cell coordinates, bounds, alpha and removed speck counts. These are review IDs, not confirmed runtime item IDs.

Processing uses fixed 4x4 sheet coordinates and nearest-neighbor uniform whole-sheet scaling. No individual subject resizing, trimming, recentering or outline modification. Tools/plants originally had a white background: a separate local derivative removes connected near-white background plus the visually identified saw-grip and toolbox-handle holes. This is local processing, not a newly generated transparent source. Other source alpha is preserved.

Small disconnected components below 2% of the largest component in each source cell are removed from review copies only. For C02 (sponge), retain only the largest connected component to remove the visually verified neighboring spray-nozzle fragment. This cleans observed neighboring fragments below grass and beside the sponge; each removal count is recorded. Other large disconnected parts are retained. Subject interiors are not made fully opaque.

Visual review: all 53 exports are readable and nonempty; light/dark previews inspected. The wood outlines remain visibly heavier than the tools, and tools/plants have finer detail. Thus cross-batch outline consistency is NOT accepted yet. Native 2048 production requirements are also not satisfied by the 1254px source batches. These exports are review candidates, not final production approval.

Run `export.py` with Pillow available to reproduce in a fresh output directory. The existing-output guard intentionally prevents accidental replacement. Script checks 53 unique, nonempty 64x64 sprites with transparent pixels.

Chain IDs: W wood (7), T tools (8), P plants (7), A animals (7), C cleaning (6), G guides (6), F food (6). Generators: GEN-W wood station, GEN-T toolbox, GEN-A animal reception, GEN-P nursery, GEN-S visitor service cabinet, GEN-F food stall.
