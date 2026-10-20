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

/// The round size each square of a bar chart stands for, as the web's `barStep`: 1, 2, 2.5 or 5 times
/// a power of ten, the smallest with which `max` fits in `squares`.
public func ds1BarStep(_ max: Double, squares: Int) -> Double {
    for exponent in -4 ... 9 {
        for base in [1.0, 2, 2.5, 5] {
            let step = base * pow(10, Double(exponent))
            if (max / step).rounded(.up) <= Double(Swift.max(1, squares)) { return step }
        }
    }
    return 5e9
}

/// `ds-bars`: nonnegative values side by side, each bar `span` squares wide (or, with `fill`, the
/// width beside the scale shared in whole points) and drawn a point narrower, rising from a hairline
/// in an area `rows - 1` squares high, then its caption (where any bar has one) and its muted label,
/// a square each in the small type. Ink bars are the faint fill, up the accent green, down tuned red;
/// a `compare` outline in the ink. `axis` puts the scale at the end, two squares wide: each square a
/// round step, its label just above its line, the lines across the bars. `values` writes each bar's
/// value just over it. `format` writes both. Read as one element: each label with its caption.
public struct DS1Bars: View {
    @Environment(\.ds1Scale) private var scale
    let items: [DS1BarItem]
    let rows: Int
    let span: Int
    let axis: Bool
    let values: Bool
    let fill: Bool
    let format: (Double) -> String

    public init(_ items: [DS1BarItem], rows: Int = 4, span: Int = 2, axis: Bool = false, values: Bool = false, fill: Bool = false, format: @escaping (Double) -> String = DS1Bars.compact) {
        self.items = items; self.rows = max(2, rows); self.span = max(1, span)
        self.axis = axis; self.values = values; self.fill = fill; self.format = format
    }

    /// Short figures, as the web's compact numbers: 950, 1.4K, 2.5M.
    public static func compact(_ value: Double) -> String {
        value.formatted(.number.notation(.compactName).precision(.fractionLength(0 ... 1)))
    }

    public var body: some View {
        let squares = rows - 1
        let height = CGFloat(squares) * scale.unit
        let top = max(items.flatMap { [$0.value, $0.compare ?? 0] }.max() ?? 0, 1e-9)
        let step = axis ? ds1BarStep(top, squares: squares - (values ? 1 : 0)) : 0
        let room = height - scale(4) - (values ? scale.unit : 0)
        let px = { (value: Double) in max(1, (axis ? CGFloat(value / step) * scale.unit : CGFloat(value / top) * room).rounded()) }
        let captions = items.contains { !($0.caption ?? "").isEmpty }
        let ticks = axis ? (1 ... squares).filter { Double($0) * step <= top + step } : []
        HStack(alignment: .top, spacing: 0) {
            HStack(alignment: .top, spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    cell(item, height: height, captions: captions, px: px)
                }
            }
            .background(alignment: .top) {
                if axis { guides(height: height, lines: ticks.count) }
            }
            if axis {
                ZStack(alignment: .bottomTrailing) {
                    Color.clear
                    ForEach(ticks, id: \.self) { row in
                        small(format(Double(row) * step), tone: .textMuted)
                            .offset(y: -(CGFloat(row) * scale.unit + scale(2)))
                    }
                }
                .frame(width: scale.squares(2), height: height)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(items.map { [$0.label, $0.caption].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: ": ") }.joined(separator: ", "))
    }

    @ViewBuilder private func cell(_ item: DS1BarItem, height: CGFloat, captions: Bool, px: @escaping (Double) -> CGFloat) -> some View {
        let width: CGFloat? = fill ? nil : CGFloat(span) * scale.unit
        VStack(alignment: .leading, spacing: 0) {
            GeometryReader { geometry in
                let bar = geometry.size.width - DS1Metrics.line
                ZStack(alignment: .bottomLeading) {
                    Color.clear
                    if item.value > 0 {
                        Rectangle().fill(Self.fill(item.tone)).frame(width: bar, height: px(item.value))
                    }
                    if let compare = item.compare {
                        Rectangle().strokeBorder(DS1Color.text, lineWidth: DS1Metrics.line).frame(width: bar, height: px(compare))
                    }
                    if values && item.value > 0 {
                        small(format(item.value), tone: .text)
                            .frame(width: bar)
                            .offset(y: -(px(item.value) + scale(2)))
                    }
                }
            }
            .frame(height: height)
            .background(alignment: .bottom) { Rectangle().fill(DS1Color.slateLight).frame(height: DS1Metrics.line) }
            if captions {
                DS1LineText(item.caption ?? "", style: .small).frame(height: scale.unit, alignment: .leading).clipped()
            }
            DS1LineText(item.label, style: .small, tone: .muted).frame(height: scale.unit, alignment: .leading).clipped()
        }
        .frame(width: width)
        .frame(maxWidth: fill ? .infinity : nil)
    }

    /// The scale's lines across the bars, one a square from the foot up to its highest label, under them.
    private func guides(height: CGFloat, lines: Int) -> some View {
        Canvas { context, size in
            var path = Path()
            for row in 0 ..< lines {
                let y = size.height - CGFloat(row + 1) * scale.unit
                path.addRect(CGRect(x: 0, y: y - DS1Metrics.line / 2, width: size.width, height: DS1Metrics.line))
            }
            context.fill(path, with: .style(DS1Color.slateLight))
        }
        .frame(height: height)
        .allowsHitTesting(false)
    }

    private func small(_ text: String, tone: DS1Color) -> some View {
        Text(text)
            .font(DS1Font.font(.regular, size: scale.small))
            .monospacedDigit()
            .lineLimit(1)
            .fixedSize()
            .foregroundStyle(tone)
    }

    static func fill(_ tone: DS1BarItem.Tone) -> DS1Color {
        switch tone {
        case .up: .appleGreen
        case .down: .tunedRed
        case .ink: .slateLight
        }
    }
}
