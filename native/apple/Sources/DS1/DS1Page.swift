import SwiftUI

/// A page on the paper (`ds-page` `column`): it puts the device scale on, scrolls, keeps one
/// square around its content and stands its column on whole squares, at most `measure`
/// squares wide (`measure="N"`), centred in the room beside it.
public struct DS1Page<Content: View>: View {
    let measure: CGFloat
    let grid: Bool
    let content: Content

    public init(measure: CGFloat = 32, grid: Bool = false, @ViewBuilder content: () -> Content) {
        self.measure = measure
        self.grid = grid
        self.content = content()
    }

    public var body: some View {
        Column(measure: measure, grid: grid, content: content).ds1Scaled()
    }

    struct Column: View {
        @Environment(\.ds1Scale) private var scale
        let measure: CGFloat
        let grid: Bool
        let content: Content

        var body: some View {
            GeometryReader { geometry in
                let width = min(scale.squares(measure), scale.wholeSquares(in: geometry.size.width - 2 * scale.unit))
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) { content }
                        .frame(width: width, alignment: .leading)
                        .padding(.vertical, scale.unit)
                        .frame(maxWidth: .infinity)
                }
                .background {
                    ZStack {
                        Rectangle().fill(DS1Color.paper)
                        if grid { DS1PaperGrid() }
                    }
                    .ignoresSafeArea()
                }
            }
        }
    }
}

/// The grid's lines on the paper, one square apart, centred on the view.
public struct DS1PaperGrid: View {
    @Environment(\.ds1Scale) private var scale
    let colour: DS1Color

    /// `--grid-color-light`: the ink at about a sixth.
    public init(_ colour: DS1Color = DS1Color.slate.withOpacity(0.169)) { self.colour = colour }

    public var body: some View {
        Canvas { context, size in
            let step = scale.unit
            var path = Path()
            var x = (size.width / 2).truncatingRemainder(dividingBy: step)
            while x <= size.width {
                path.move(to: CGPoint(x: x, y: 0))
                path.addLine(to: CGPoint(x: x, y: size.height))
                x += step
            }
            var y: CGFloat = 0
            while y <= size.height {
                path.move(to: CGPoint(x: 0, y: y))
                path.addLine(to: CGPoint(x: size.width, y: y))
                y += step
            }
            context.stroke(path, with: .style(colour), lineWidth: DS1Metrics.line)
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}
