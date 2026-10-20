import SwiftUI

/// A bar of `DS1Bars`, as the web's `BarItem` (DS1/2-core/ds-chart.ts): its label under it, its
/// value, an optional `compare` drawn as an outline at its height (the expected figure), a tone and
/// a caption over the label.
public struct DS1BarItem: Hashable, Sendable {
    public enum Tone: Sendable { case up, down, ink }
    public var label: String
    public var value: Double
    public var compare: Double?
    public var tone: Tone
    public var caption: String?

    public init(label: String, value: Double, compare: Double? = nil, tone: Tone = .ink, caption: String? = nil) {
        self.label = label; self.value = value; self.compare = compare; self.tone = tone; self.caption = caption
    }
}

/// `ds-bars`: nonnegative values side by side, each bar `span` squares wide and drawn a point
/// narrower, rising from a hairline in an area `rows - 1` squares high, then its caption and its
/// muted label, a square each in the small type. Ink bars are the faint fill, up the accent green,
/// down tuned red; a `compare` outline in the ink. Read as one element: each label with its caption.
public struct DS1Bars: View {
    @Environment(\.ds1Scale) private var scale
    let items: [DS1BarItem]
    let rows: Int
    let span: Int

    public init(_ items: [DS1BarItem], rows: Int = 4, span: Int = 2) {
        self.items = items; self.rows = max(2, rows); self.span = max(1, span)
    }

    public var body: some View {
        let height = CGFloat(rows - 1) * scale.unit
        let width = CGFloat(span) * scale.unit
        let top = max(items.flatMap { [$0.value, $0.compare ?? 0] }.max() ?? 0, 1e-9)
        let px = { (value: Double) in max(1, (CGFloat(value / top) * (height - scale(4))).rounded()) }
        HStack(alignment: .top, spacing: 0) {
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                VStack(alignment: .leading, spacing: 0) {
                    ZStack(alignment: .bottomLeading) {
                        if item.value > 0 {
                            Rectangle().fill(Self.fill(item.tone)).frame(width: width - DS1Metrics.line, height: px(item.value))
                        }
                        if let compare = item.compare {
                            Rectangle().strokeBorder(DS1Color.text, lineWidth: DS1Metrics.line).frame(width: width - DS1Metrics.line, height: px(compare))
                        }
                    }
                    .frame(width: width, height: height, alignment: .bottomLeading)
                    .background(alignment: .bottom) { Rectangle().fill(DS1Color.slateLight).frame(height: DS1Metrics.line) }
                    DS1LineText(item.caption ?? "", style: .small)
                        .frame(width: width, height: scale.unit, alignment: .leading)
                        .clipped()
                    DS1LineText(item.label, style: .small, tone: .muted)
                        .frame(width: width, height: scale.unit, alignment: .leading)
                        .clipped()
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(items.map { [$0.label, $0.caption].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: ": ") }.joined(separator: ", "))
    }

    static func fill(_ tone: DS1BarItem.Tone) -> DS1Color {
        switch tone {
        case .up: .appleGreen
        case .down: .tunedRed
        case .ink: .slateLight
        }
    }
}
