"""Add currency marks and the true minus to Olivetti Dot.

Usage: python scripts/fonts/build-olivetti-currency.py [FONT.woff2]
Requires fonttools and brotli. Rewrites the font in place (default: the
website's OlivettiDot-Regular.woff2). Running it again redraws the same
glyphs rather than adding them twice.

Olivetti Dot is a 5 x 7 dot matrix: every dot is the full stop's circle,
centred on columns x = 165 + 110 * i and rows y = 55 + 110 * j, row 0 the
baseline. A five-column glyph advances 770. Each mark below is drawn in
that grid, read top row first; a dot is "#".
"""
from pathlib import Path
import sys

from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

VERSION = 1.3
PITCH, ORIGIN_X, ORIGIN_Y, ADVANCE = 110, 165, 55, 770

MARKS = {
    # code point: (glyph name, rows from the top)
    0x00A2: ('cent', ['..#..', '.####', '#.#..', '#.#..', '#.#..', '.####', '..#..']),
    0x00A4: ('currency', ['.....', '#...#', '.###.', '.#.#.', '.###.', '#...#', '.....']),
    0x00A5: ('yen', ['#...#', '.#.#.', '#####', '..#..', '#####', '..#..', '..#..']),
    0x0E3F: ('uni0E3F', ['..#..', '####.', '#.#.#', '####.', '#.#.#', '####.', '..#..']),
    0x20A6: ('uni20A6', ['#...#', '##..#', '#####', '#.#.#', '#####', '#..##', '#...#']),
    0x20A9: ('uni20A9', ['#...#', '#...#', '#####', '#.#.#', '#####', '.#.#.', '.#.#.']),
    0x20AC: ('Euro', ['..###', '.#...', '####.', '.#...', '####.', '.#...', '..###']),
    0x20B1: ('uni20B1', ['.###.', '#####', '.#..#', '#####', '.#...', '.#...', '.#...']),
    0x20B8: ('uni20B8', ['#####', '.....', '#####', '..#..', '..#..', '..#..', '..#..']),
    0x20B9: ('uni20B9', ['#####', '...#.', '#####', '...#.', '###..', '..#..', '...##']),
    0x20BA: ('uni20BA', ['.#...', '.#.#.', '.##..', '##...', '.#..#', '.#..#', '.###.']),
    0x20BD: ('uni20BD', ['.###.', '.#..#', '.#..#', '####.', '.#...', '###..', '.#...']),
    0x20BF: ('uni20BF', ['.#.#.', '####.', '#...#', '####.', '#...#', '####.', '.#.#.']),
    # The true minus matches the plus: five dots on its bar.
    0x2212: ('minus', ['.....', '.....', '.....', '#####', '.....', '.....', '.....']),
}


def dots(rows):
    assert len(rows) == 7 and all(len(r) == 5 for r in rows), rows
    for top, row in enumerate(rows):
        for column, mark in enumerate(row):
            if mark == '#':
                yield column, 6 - top


def build(path):
    font = TTFont(path)
    cff = font['CFF '].cff
    top = cff.topDictIndex[0]
    strings, private = top.CharStrings, top.Private
    glyphs = font.getGlyphSet()

    # The full stop is one dot at column 0, row 0: the pattern for every dot.
    dot = RecordingPen()
    glyphs[font.getBestCmap()[ord('.')]].draw(dot)

    order = list(font.getGlyphOrder())
    nominal = getattr(private, 'nominalWidthX', 0)
    for code, (name, rows) in MARKS.items():
        pen = T2CharStringPen(ADVANCE - nominal, None)
        for column, row in dots(rows):
            dot.replay(TransformPen(pen, (1, 0, 0, 1, column * PITCH, row * PITCH)))
        charstring = pen.getCharString(private=private, globalSubrs=cff.GlobalSubrs)
        if name in strings.charStrings:
            strings[name] = charstring
        else:
            strings.charStringsIndex.append(charstring)
            strings.charStrings[name] = len(strings.charStringsIndex) - 1
            order.append(name)
        left = min(column for column, _ in dots(rows)) * PITCH + ORIGIN_X - 50
        font['hmtx'][name] = (ADVANCE, left)
        for table in font['cmap'].tables:
            if table.isUnicode():
                table.cmap[code] = name

    top.charset = order
    font.setGlyphOrder(order)
    font['maxp'].numGlyphs = len(order)
    os2 = font['OS/2']
    os2.usLastCharIndex = min(0xFFFF, max(font.getBestCmap()))
    os2.recalcUnicodeRanges(font)
    font['head'].fontRevision = VERSION
    for record in font['name'].names:
        if record.nameID == 3:
            record.string = f'Olivetti Dot Regular {VERSION:.3f}'
        elif record.nameID == 5:
            record.string = f'Version {VERSION:.3f}'
    font.flavor = 'woff2'
    font.save(path)
    print(f'{path}: {len(font.getBestCmap())} characters, {len(order)} glyphs')


if __name__ == '__main__':
    default = Path(__file__).resolve().parents[2] / 'website/src/assets/fonts/OlivettiDot-Regular.woff2'
    build(Path(sys.argv[1]) if len(sys.argv) > 1 else default)
