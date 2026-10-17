import CoreText
import SwiftUI

/// The text styles of `ds-text` and text.css: 14 text, 10 small, 13 heading and a 20 display
/// title on two squares, each on lines one square tall.
public enum DS1TextStyle: Sendable {
    case text, small, heading, display

    func size(_ scale: DS1Scale) -> CGFloat {
        switch self {
        case .text: scale.type
        case .small: scale.small
        case .heading: scale.heading
        case .display: scale.display
        }
    }
    func tracking(_ scale: DS1Scale) -> CGFloat { self == .display ? scale.displayTracking : scale.tracking }
    /// The line the text stands on: one square, two for a display title.
    func line(_ scale: DS1Scale) -> CGFloat { self == .display ? 2 * scale.unit : scale.unit }
}

/// The colours of `ds-text`'s `tone`.
public enum DS1Tone: Sendable {
    case text, muted, title, danger

    public var colour: DS1Color {
        switch self {
        case .text: .text
        case .muted: .textMuted
        case .title: .title
        case .danger: .danger
        }
    }
}

extension DS1Font {
    /// Text drawn as Design system 1 draws it: in `face` with the style's size and tracking,
    /// arrows in Inter, and with `figures`, digits and the signs of numbers in Olivetti Dot,
    /// each digit centred in a cell of the same width (the face's 1 is narrower than its 0).
    /// `cells: false` sets the figures in Olivetti Dot at their own widths, as a date reads.
    public static func attributed(_ string: String, style: DS1TextStyle = .text, scale: DS1Scale, face: Face = .regular, figures: Bool = false, cells: Bool = true) -> AttributedString {
        attributed(string, size: style.size(scale), tracking: style.tracking(scale), face: face, figures: figures, cells: cells)
    }

    /// The same at a size of the product's own, already scaled, such as a figure set large.
    public static func attributed(_ string: String, size: CGFloat, tracking: CGFloat, face: Face = .regular, figures: Bool = false, cells: Bool = true) -> AttributedString {
        let text = font(face, size: size)
        let arrow = font(.arrows, size: size)
        // Olivetti Dot's digits stand as tall as GT America's capitals on the same baseline.
        let figureSize = size * figureScale
        let figure = font(.figures, size: figureSize)
        let figureFont = ctFont(.figures, size: figureSize)
        let cell = advance(of: "0", in: figureFont)

        enum Kind { case text, arrow, figure, digit }
        var pieces: [(Character, Kind, CGFloat)] = string.map { character in
            let scalar = character.unicodeScalars.count == 1 ? character.unicodeScalars.first : nil
            if let scalar, arrowCharacters.contains(scalar) { return (character, .arrow, tracking) }
            if figures, let scalar, figureCharacters.contains(scalar) {
                return (character, cells && CharacterSet.decimalDigits.contains(scalar) ? .digit : .figure, tracking)
            }
            return (character, .text, tracking)
        }
        // Centre each digit in its cell: half the spare width after the character before it,
        // half after the digit itself.
        for i in pieces.indices where pieces[i].1 == .digit {
            let spare = max(0, cell - advance(of: pieces[i].0, in: figureFont)) / 2
            pieces[i].2 = spare
            if i > 0 { pieces[i - 1].2 += spare }
        }
        var result = AttributedString()
        for (character, kind, kern) in pieces {
            var piece = AttributedString(String(character))
            piece.font = kind == .text ? text : kind == .arrow ? arrow : figure
            piece.kern = kern
            result += piece
        }
        return result
    }

    /// How much smaller Olivetti Dot is set than the text beside it, so a digit is exactly as
    /// tall as GT America's capital: the regular face's cap height over the dotted zero's.
    public static var figureScale: CGFloat {
        guard isAvailable(.figures), isAvailable(.regular) else { return 1 }
        let gt = ctFont(.regular, size: 100), dots = ctFont(.figures, size: 100)
        let utf16 = Array("0".utf16)
        var glyph: [CGGlyph] = [0]
        guard CTFontGetGlyphsForCharacters(dots, utf16, &glyph, 1) else { return 1 }
        var box = CGRect.zero
        CTFontGetBoundingRectsForGlyphs(dots, .horizontal, glyph, &box, 1)
        return box.maxY > 0 ? CTFontGetCapHeight(gt) / box.maxY : 1
    }

    /// Where the baseline of a line box `line` tall stands, measured from its top, as the web sets
    /// GT America in a line of that height (CSS half-leading): the spare height split above
    /// and below the regular face's ascent and descent. A row's text takes a 16-point box at
    /// the foot of its square (`DS1Metrics.leading`), so `ds1Baseline` adds the spare four.
    public static func baseline(size: CGFloat, line: CGFloat) -> CGFloat {
        let gt = ctFont(.regular, size: size)
        let ascent = CTFontGetAscent(gt), descent = CTFontGetDescent(gt)
        return (line - ascent - descent) / 2 + ascent
    }

    /// Where the baseline stands in a line box `line` tall when the regular face's capitals are
    /// centred in it, measured from its top: on the row's sixteen the capitals are then centred
    /// on a 16-point icon beside them, as the web's GT America falls in its 16px line box
    /// (cap top 7px below a row's top line, baseline 3px above the next).
    public static func capBaseline(size: CGFloat, line: CGFloat) -> CGFloat {
        (line + CTFontGetCapHeight(ctFont(.regular, size: size))) / 2
    }

    /// The height one line of a face takes when nothing spaces it: ascent, descent and gap.
    public static func lineHeight(_ face: Face, size: CGFloat) -> CGFloat {
        let font = ctFont(face, size: size)
        return CTFontGetAscent(font) + CTFontGetDescent(font) + CTFontGetLeading(font)
    }

    static func advance(of character: Character, in font: CTFont) -> CGFloat {
        let utf16 = Array(String(character).utf16)
        var glyphs = [CGGlyph](repeating: 0, count: utf16.count)
        guard CTFontGetGlyphsForCharacters(font, utf16, &glyphs, utf16.count) else { return 0 }
        return CGFloat(CTFontGetAdvancesForGlyphs(font, .horizontal, glyphs, nil, glyphs.count))
    }
}

/// Text standing on its square (`ds-text`): one line, cut short at its end, or with `wrap`
/// as many lines as it needs, each one square tall.
public struct DS1LineText: View {
    @Environment(\.ds1Scale) private var scale
    @Environment(\.multilineTextAlignment) private var textAlignment
    let string: String
    let style: DS1TextStyle
    let tone: DS1Tone
    let strong: Bool
    let figures: Bool
    let cells: Bool
    let wrap: Bool

    public init(_ string: String, style: DS1TextStyle = .text, tone: DS1Tone = .text, strong: Bool = false, figures: Bool = false, cells: Bool = true, wrap: Bool = false) {
        self.string = string
        self.style = style
        self.tone = tone
        self.strong = strong
        self.figures = figures
        self.cells = cells
        self.wrap = wrap
    }

    private var alignment: HorizontalAlignment {
        switch textAlignment {
        case .center: .center
        case .trailing: .trailing
        default: .leading
        }
    }

    public var body: some View {
        let face: DS1Font.Face = strong || style == .heading ? .medium : .regular
        let line = style.line(scale)
        let text = Text(DS1Font.attributed(string, style: style, scale: scale, face: face, figures: figures, cells: cells))
            .foregroundStyle(tone.colour)
            .accessibilityLabel(string)
        if wrap {
            // The web centres the face's height in each line; the text system lays every line
            // a whole point tall, so the lines are spaced from that and the first stands as the
            // web's does, each on its own square. The block takes the alignment it is set in.
            let glyphs = DS1Font.lineHeight(face, size: style.size(scale))
            let laid = glyphs.rounded(.up)
            let above = max(0, line - glyphs) / 2
            text
                .lineSpacing(max(0, line - laid))
                .padding(.top, above)
                .padding(.bottom, max(0, line - laid - above))
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, minHeight: line, alignment: Alignment(horizontal: alignment, vertical: .center))
        } else {
            text
                .lineLimit(1)
                .truncationMode(.tail)
                .ds1Baseline(style)
        }
    }
}

/// A figure (an amount, a count, a date) in Olivetti Dot on its line, as text.
public struct DS1Figures: View {
    @Environment(\.ds1Scale) private var scale
    let string: String
    let style: DS1TextStyle
    let tone: DS1Tone

    public init(_ string: String, style: DS1TextStyle = .text, tone: DS1Tone = .text) {
        self.string = string
        self.style = style
        self.tone = tone
    }

    /// A figure is never cut short: it keeps its width and the words beside it give way.
    public var body: some View {
        DS1LineText(string, style: style, tone: tone, figures: true)
            .fixedSize(horizontal: true, vertical: false)
            .layoutPriority(1)
    }
}


extension View {
    /// Stands a line of text on its square at the web's baseline for `style`, whatever its
    /// faces: GT America, Olivetti Dot or both sit on the same line, row after row.
    public func ds1Baseline(_ style: DS1TextStyle = .text) -> some View {
        modifier(DS1Baseline(style: style))
    }
}

private struct DS1Baseline: ViewModifier {
    @Environment(\.ds1Scale) private var scale
    let style: DS1TextStyle
    func body(content: Content) -> some View {
        let line = style.line(scale)
        // A title rests on the grid's line at its foot, so what stands beside it shares its square;
        // other text takes the lower sixteen of its square with the spare four above, as Ezo
        // sets it (a 16px line box at the foot of the row): GT America stands where the web's
        // half-leading puts it in that sixteen, its capitals centred on a 16-point icon beside it.
        let baseline = style == .display ? line : line - scale.leading + DS1Font.capBaseline(size: style.size(scale), line: scale.leading)
        content
            .alignmentGuide(VerticalAlignment.top) { d in d[.firstTextBaseline] - baseline }
            .frame(height: line, alignment: .top)
    }
}
