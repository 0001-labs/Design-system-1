"""Shape and render a private study without opening a browser.

Usage: python scripts/fonts/proof-handwriting.py PRIVATE_DIRECTORY
Requires uharfbuzz, fonttools and pymupdf in addition to the build dependencies.
Writes SVG/PNG proofs and verifies that contextual alternates and source-word
ligatures actually shape. The private glyph manifest is never embedded in code.
"""
import html
import json
from pathlib import Path
import sys

import pymupdf
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen


def main(root):
    build = root / 'build'
    path = build / 'Supernatural-Study-Regular.ttf'
    font = TTFont(path, checkChecksums=2)
    glyph_set, order = font.getGlyphSet(), font.getGlyphOrder()
    shaper = hb.Font(hb.Face(path.read_bytes()))
    coverage = json.loads((build / 'coverage.json').read_text())

    def shape(text, **features):
        buffer = hb.Buffer()
        buffer.add_str(text)
        buffer.guess_segment_properties()
        hb.shape(shaper, buffer, features)
        assert all(info.codepoint for info in buffer.glyph_infos), f'Missing glyph in {text!r}'
        return list(zip(buffer.glyph_infos, buffer.glyph_positions))

    # WOFF2 round-trip must preserve all encoded characters and outlines.
    webfont = TTFont(build / 'Supernatural-Study-Regular.woff2', checkChecksums=2)
    assert webfont.getBestCmap() == font.getBestCmap()
    assert webfont.getGlyphOrder() == order
    for name in order:
        assert webfont['glyf'][name].compile(webfont['glyf']) == font['glyf'][name].compile(font['glyf'])
    plain = [info.codepoint for info, _ in shape('eeee eeee', calt=False)]
    varied = [info.codepoint for info, _ in shape('eeee eeee', calt=True)]
    assert plain != varied, 'Contextual variation did not change glyph selection'
    for word in coverage['sourceWordLigatures']:
        shaped = shape(word, liga=True, calt=True)
        assert len(shaped) == 1 and order[shaped[0][0].codepoint] == 'word_' + word

    lines = [
        'supernatural', 'a little of the natural.',
        'every letter a little different.', 'the world is handwritten.',
        'love and rhythm.', 'a b c d e f g h i j k l m',
        'n o p r s t u v w y',
    ]
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1280" viewBox="0 0 1600 1280"><rect width="1600" height="1280" fill="#fafaf6"/>']
    parts.append('<text x="60" y="45" font-family="sans-serif" font-size="18" fill="#555">Supernatural · Study 0.001 · Original handwriting</text>')
    for row, text in enumerate(lines):
        x, y, size = 65, 175 + row * 145, 105 if row == 0 else 78
        for info, position in shape(text, calt=True, liga=True):
            pen = SVGPathPen(glyph_set)
            glyph_set[order[info.codepoint]].draw(pen)
            parts.append(f'<path d="{pen.getCommands()}" transform="translate({x + position.x_offset * size / 1000},{y - position.y_offset * size / 1000}) scale({size / 1000},{-size / 1000})"/>')
            x += position.x_advance * size / 1000
        assert x < 1550, f'Proof line exceeds the page: {text}'
    missing = coverage['missingLowercase']
    parts.append(f'<text x="60" y="1220" font-family="sans-serif" font-size="18" fill="#555">Partial study · Missing lowercase: {html.escape(missing)} · Capitals and numerals incomplete</text></svg>')
    svg = ''.join(parts)
    (build / 'first-proof.svg').write_text(svg)
    document = pymupdf.open(stream=svg.encode(), filetype='svg')
    pdf = pymupdf.open('pdf', document.convert_to_pdf())
    pdf[0].get_pixmap().save(build / 'first-proof.png')
    print('Verified: font tables, WOFF2 outlines, specimen coverage, real contextual alternates and all source-word ligatures.')


if __name__ == '__main__':
    main(Path(sys.argv[1]).resolve())
