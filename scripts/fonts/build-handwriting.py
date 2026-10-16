"""Build a private handwriting study from attributed scan crops.

Usage: python scripts/fonts/build-handwriting.py PRIVATE_DIRECTORY
Requires fonttools, brotli, opencv-python-headless, Pillow and potrace.
The directory contains glyphs.json and source/full-N.png (3600px long edge).
Source crops, intermediate outlines and font outputs stay in that directory.
No missing letters or artificial alternate forms are synthesized.
"""
from collections import defaultdict
from hashlib import sha256
import json
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET

import cv2
import numpy as np
from PIL import Image, ImageDraw
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.svgLib.path import parse_path
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString


def extract(root, sample, pages):
    page = sample['page']
    if page not in pages:
        pages[page] = Image.open(root / f'source/full-{page}.png').convert('RGB')
    box = sample['box']
    # Coordinates are expressed on an 1800px preview; full scans are twice that.
    left, top, right, bottom = [round(v * 2) for v in box]
    image = pages[page].crop((left, top, right, bottom))
    gray = cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2GRAY)
    ink = (gray < sample.get('threshold', 135)).astype(np.uint8) * 255
    if sample.get('polygon'):
        mask = np.zeros_like(ink)
        polygon = np.array([[(round(x * 2 - left), round(y * 2 - top)) for x, y in sample['polygon']]], dtype=np.int32)
        cv2.fillPoly(mask, polygon, 255)
        ink = cv2.bitwise_and(ink, mask)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(ink)
    keep = sorted(range(1, count), key=lambda i: stats[i, cv2.CC_STAT_AREA], reverse=True)
    if 'components' in sample:
        keep = keep[:sample['components']]
    keep = [i for i in keep if stats[i, cv2.CC_STAT_AREA] >= 8]
    return np.where(np.isin(labels, keep), 255, 0).astype(np.uint8)


def main(root):
    manifest = json.loads((root / 'glyphs.json').read_text())
    output = root / 'build'
    output.mkdir(exist_ok=True)
    pages, glyphs, metrics, groups, provenance, ligatures = {}, {}, {}, defaultdict(list), [], []
    empty = TTGlyphPen(None)
    glyphs['.notdef'] = empty.glyph()
    metrics['.notdef'] = (600, 0)
    glyphs['space'] = TTGlyphPen(None).glyph()
    metrics['space'] = (320, 0)
    cmap = {32: 'space', 160: 'space'}
    contact = Image.new('RGB', (1400, ((len(manifest['glyphs']) + 6) // 7) * 230), '#fafaf6')
    draw = ImageDraw.Draw(contact)
    for index, sample in enumerate(manifest['glyphs']):
        char = sample.get('text', sample.get('char'))
        is_word = len(char) > 1
        base = 'word_' + char if is_word else f'uni{ord(char):04X}'
        name = base if is_word or not groups[char] else f'{base}.alt{len(groups[char])}'
        ink = extract(root, sample, pages)
        if not ink.any():
            raise ValueError(f'No ink for {char!r}, crop {index}')
        bitmap = output / f'{name}.pbm'
        # Potrace traces foreground black; use an explicit PBM without dither.
        Image.fromarray(255 - ink).convert('1', dither=Image.Dither.NONE).save(bitmap)
        svg = output / f'{name}.svg'
        subprocess.run(['potrace', str(bitmap), '--svg', '--output', str(svg), '--turdsize', '4', '--opttolerance', '0.15'], check=True)
        recording = RecordingPen()
        for path in ET.parse(svg).getroot().iter('{http://www.w3.org/2000/svg}path'):
            parse_path(path.attrib['d'], recording)
        # Potrace paths use 10 units per raster pixel, y positive up.
        scale = sample['scale'] / 20
        placement = RecordingPen()
        recording.replay(TransformPen(placement, (scale, 0, 0, scale, 0, (sample['baseline'] - sample['box'][3]) * sample['scale'])))
        bounds = BoundsPen(None)
        placement.replay(bounds)
        if not bounds.bounds:
            raise ValueError(f'No outline for {name}')
        xmin, ymin, xmax, ymax = bounds.bounds
        lsb = sample.get('lsb', 10)
        pen = TTGlyphPen(None)
        placement.replay(TransformPen(Cu2QuPen(pen, max_err=0.6, reverse_direction=False), (1, 0, 0, 1, lsb - xmin, 0)))
        glyphs[name] = pen.glyph()
        metrics[name] = (round(xmax - xmin + lsb + sample.get('rsb', 10)), lsb)
        if is_word:
            ligatures.append((char, name))
        else:
            groups[char].append(name)
            cmap.setdefault(ord(char), name)
        # Pair straight/curly apostrophes only; no unobserved letters are added.
        if char == "'":
            cmap[0x2018] = cmap[0x2019] = name
        preview = Image.fromarray(255 - ink)
        preview.thumbnail((175, 170))
        x, y = (index % 7) * 200, (index // 7) * 230
        draw.text((x + 4, y + 5), f"{char} {len(groups[char])} | p{sample['page']} {sample['word']}", fill='black')
        contact.paste(preview, (x + 10, y + 33))
        provenance.append({**sample, 'glyph': name, 'advance': metrics[name][0], 'bounds': [round(v) for v in [lsb, ymin, xmax - xmin + lsb, ymax]]})
    contact.save(output / 'source-glyphs.png')
    builder = FontBuilder(1000, isTTF=True)
    builder.setupGlyphOrder(list(glyphs))
    builder.setupCharacterMap(cmap)
    builder.setupGlyf(glyphs)
    builder.setupHorizontalMetrics(metrics)
    builder.setupHorizontalHeader(ascent=1250, descent=-900, lineGap=0)
    builder.setupNameTable({
        'familyName': manifest['family'], 'styleName': 'Study Regular',
        'uniqueFontIdentifier': f"{manifest['family']};{manifest['version']};original-scans",
        'fullName': manifest['family'] + ' Study Regular',
        'psName': manifest['family'] + '-StudyRegular',
        'version': 'Version ' + manifest['version'],
        'copyright': 'Copyright 2026 Joachim. Private development study. All rights reserved.',
        'description': 'Partial handwriting study traced from original scans. Missing characters are intentionally absent. Not a finished text face.',
    })
    builder.setupOS2(sTypoAscender=1250, sTypoDescender=-900, sTypoLineGap=0, usWinAscent=1500, usWinDescent=1100, sxHeight=450, sCapHeight=850, fsType=0, achVendID='0001')
    builder.setupPost(italicAngle=-18)
    builder.setupMaxp()
    builder.font['head'].fontRevision = float(manifest['version'])
    features = ['languagesystem DFLT dflt;', 'languagesystem latn dflt;']
    if ligatures:
        features.append('feature liga {')
        for text, name in sorted(ligatures, key=lambda item: -len(item[0])):
            features.append('  sub ' + ' '.join(cmap[ord(c)] for c in text) + ' by ' + name + ';')
        features.append('} liga;')
    # Cycle real alternate scans by word position; no random or transformed clones.
    bases, alternatives, thirds = [], [], []
    for char, names in groups.items():
        if len(names) > 1:
            bases.append(names[0]); alternatives.append(names[1])
            thirds.append(names[2] if len(names) > 2 else names[0])
    if bases:
        all_names = [n for char, names in groups.items() if char.isalpha() for n in names]
        features.extend([
            '@letters = [' + ' '.join(all_names) + '];',
            '@base = [' + ' '.join(bases) + '];',
            '@alternate = [' + ' '.join(alternatives) + '];',
            '@third = [' + ' '.join(thirds) + '];',
            'feature calt {',
            '  sub @alternate @base\' by @third;',
            '  sub @letters @base\' by @alternate;',
            '} calt;',
            'feature salt { sub @base by @alternate; } salt;',
        ])
    addOpenTypeFeaturesFromString(builder.font, '\n'.join(features))
    ttf = output / 'Supernatural-Study-Regular.ttf'
    builder.save(ttf)
    builder.font.flavor = 'woff2'
    woff = output / 'Supernatural-Study-Regular.woff2'
    builder.font.save(woff)
    report = {
        'version': manifest['version'], 'source': manifest['source'],
        'characters': ''.join(chr(cp) for cp in sorted(cmap) if cp > 32),
        'missingLowercase': ''.join(c for c in 'abcdefghijklmnopqrstuvwxyz' if ord(c) not in cmap),
        'alternates': {c: len(names) for c, names in groups.items() if len(names) > 1},
        'sourceWordLigatures': [text for text, _ in ligatures],
        'glyphCount': len(glyphs), 'sha256': sha256(woff.read_bytes()).hexdigest(),
        'provenance': provenance,
    }
    (output / 'coverage.json').write_text(json.dumps(report, indent=2))
    (output / 'features.fea').write_text('\n'.join(features))
    print(json.dumps({k: v for k, v in report.items() if k != 'provenance'}, indent=2))


if __name__ == '__main__':
    main(Path(sys.argv[1]).resolve())
