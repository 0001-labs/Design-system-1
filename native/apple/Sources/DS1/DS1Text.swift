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
    public static func attributed(_ string: String, style: DS1TextStyle = .text, scale: DS1Scale, face: Face = .regular, figures: Bool = false) -> AttributedString {
        let size = style.size(scale)
        let tracking = style.tracking(scale)
        let text = font(face, size: size)
        let arrow = font(.arrows, size: size)
        let figure = font(.figures, size: size)
        let figureFont = ctFont(.figures, size: size)
        let cell = advance(of: "0", in: figureFont)

        enum Kind { case text, arrow, figure, digit }
        var pieces: [(Character, Kind, CGFloat)] = string.map { character in
            let scalar = character.unicodeScalars.count == 1 ? character.unicodeScalars.first : nil
            if let scalar, arrowCharacters.contains(scalar) { return (character, .arrow, tracking) }
            if figures, let scalar, figureCharacters.contains(scalar) {
                return (character, CharacterSet.decimalDigits.contains(scalar) ? .digit : .figure, tracking)
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

    static func advance(of character: Character, in font: CTFont) -> CGFloat {
        let utf16 = Array(String(character).utf16)
        var glyphs = [CGGlyph](repeating: 0, count: utf16.count)
        guard CTFontGetGlyphsForCharacters(font, utf16, &glyphs, utf16.count) else { return 0 }
        return CGFloat(CTFontGetAdvancesForGlyphs(font, .horizontal, glyphs, nil, glyphs.count))
    }
}

/// One line of text standing on its square (`ds-text`): never wraps, cut short at its end.
public struct DS1LineText: View {
    @Environment(\.ds1Scale) private var scale
    let string: String
    let style: DS1TextStyle
    let tone: DS1Tone
    let strong: Bool
    let figures: Bool

    public init(_ string: String, style: DS1TextStyle = .text, tone: DS1Tone = .text, strong: Bool = false, figures: Bool = false) {
        self.string = string
        self.style = style
        self.tone = tone
        self.strong = strong
        self.figures = figures
    }

    public var body: some View {
        Text(DS1Font.attributed(string, style: style, scale: scale, face: strong || style == .heading ? .medium : .regular, figures: figures))
            .foregroundStyle(tone.colour)
            .lineLimit(1)
            .truncationMode(.tail)
            .frame(height: style.line(scale))
            .accessibilityLabel(string)
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

    public var body: some View {
        DS1LineText(string, style: style, tone: tone, figures: true)
    }
}
