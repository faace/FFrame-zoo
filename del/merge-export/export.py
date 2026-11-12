"""Export fixed-grid review sprites; never trim or normalize individual objects."""
import hashlib
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / 'review-v3'
BATCHES = [
    ('merge-wave05/wood-transparent-v3.png', [f'W{i:02}' for i in range(1, 8)] + ['GEN-W']),
    ('merge-wave02/tools-plants-v1.png', [f'T{i:02}' for i in range(1, 9)] + [f'P{i:02}' for i in range(1, 8)] + ['GEN-T']),
    ('merge-wave03/animals-cleaning-v1.png', [f'A{i:02}' for i in range(1, 8)] + [f'C{i:02}' for i in range(1, 7)] + ['GEN-A', 'GEN-P', 'GEN-S']),
    ('merge-wave04/guides-food-v1.png', [f'G{i:02}' for i in range(1, 7)] + [f'F{i:02}' for i in range(1, 7)] + ['GEN-F']),
]


def remove_exterior_white(image):
    """Flood only near-white background; preserve enclosed subject highlights."""
    pixels = image.load()
    w, h = image.size
    queue = deque((x, y) for x in range(w) for y in (0, h - 1))
    queue.extend((x, y) for y in range(h) for x in (0, w - 1))
    # Visually identified enclosed background: saw grip and closed toolbox handle.
    queue.extend([(386, 642), (1800, 1630)])
    seen = bytearray(w * h)
    while queue:
        x, y = queue.popleft()
        if not (0 <= x < w and 0 <= y < h) or seen[y * w + x]:
            continue
        seen[y * w + x] = 1
        r, g, b, a = pixels[x, y]
        if min(r, g, b) < 240 or max(r, g, b) - min(r, g, b) > 12:
            continue
        pixels[x, y] = (r, g, b, 0)
        queue.extend(((x-1, y), (x+1, y), (x, y-1), (x, y+1)))
    return image


def remove_specks(image, keep_largest=False):
    pixels = image.load()
    w, h = image.size
    unseen = {(x, y) for y in range(h) for x in range(w) if pixels[x, y][3] > 0}
    components = []
    while unseen:
        seed = unseen.pop()
        component, queue = [seed], [seed]
        while queue:
            x, y = queue.pop()
            for dx, dy in ((-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)):
                point = (x+dx, y+dy)
                if point in unseen:
                    unseen.remove(point)
                    component.append(point)
                    queue.append(point)
        components.append(component)
    largest = max(map(len, components), default=0)
    removed = 0
    for component in components:
        if len(component) < largest * (1 if keep_largest else 0.02):
            removed += len(component)
            for x, y in component:
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)
    return image, removed


def main():
    OUT.mkdir(parents=True, exist_ok=False)
    for sub in ('native-cells', '64'):
        (OUT / sub).mkdir()
    sprites, manifest = {}, []
    for relative, ids in BATCHES:
        path = ROOT / relative
        original = Image.open(path).convert('RGBA')
        image = original.copy()
        white_removed = relative.startswith('merge-wave02/')
        if white_removed:
            assert image.size == (2048, 2048)
            image = remove_exterior_white(image)
            image.save(OUT / 'tools-plants-background-removed.png')
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        for index, item_id in enumerate(ids):
            col, row = index % 4, index // 4
            box = tuple(round(value) for value in (
                col * image.width / 4, row * image.height / 4,
                (col + 1) * image.width / 4, (row + 1) * image.height / 4))
            native, removed = remove_specks(image.crop(box), keep_largest=item_id == 'C02')
            native.save(OUT / 'native-cells' / f'{item_id}.png')
            image.paste(native, box[:2])
            # Sample the full sheet, not a tight subject crop; fixed framing remains.
            small = image.resize((256, 256), Image.Resampling.NEAREST)
            sprite = small.crop((col*64, row*64, (col+1)*64, (row+1)*64))
            sprite.save(OUT / '64' / f'{item_id}.png')
            assert sprite.size == (64, 64) and sprite.getchannel('A').getextrema()[0] == 0
            assert sprite.getbbox() is not None
            sprites[item_id] = sprite
            manifest.append(dict(review_id=item_id, source=relative, source_sha256=digest,
                                 source_size=list(original.size), cell=[row, col], crop_box=box,
                                 alpha_background_removed=white_removed,
                                 disconnected_speck_pixels_removed=removed,
                                 alpha_extrema=sprite.getchannel('A').getextrema(),
                                 visible_bounds_64=sprite.getbbox()))
    rows = [[f'{chain}{i:02}' for i in range(1, count+1)]
            for chain, count in [('W',7), ('T',8), ('P',7), ('A',7), ('C',6), ('G',6), ('F',6)]]
    rows.append(['GEN-W','GEN-T','GEN-A','GEN-P','GEN-S','GEN-F'])
    for theme, background, foreground in [('light','#edf1ed','#25322b'), ('dark','#303735','#eef3ef')]:
        board = Image.new('RGB', (800, 832), background)
        draw = ImageDraw.Draw(board)
        for row, ids in enumerate(rows):
            for col, item_id in enumerate(ids):
                x, y = col*100+18, row*104+8
                board.paste(sprites[item_id], (x,y), sprites[item_id])
                draw.text((col*100+25, y+70), item_id, fill=foreground)
        board.save(OUT / f'all-53-64px-{theme}.png')
    assert len(sprites) == len(manifest) == 53
    assert len(list((OUT / '64').glob('*.png'))) == 53
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(f'PASS: {len(sprites)} unique sprites, 64x64 RGBA, nonempty with transparent pixels; {OUT}')


if __name__ == '__main__':
    main()
