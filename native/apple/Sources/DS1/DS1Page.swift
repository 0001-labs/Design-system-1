import SwiftUI

/// A page on the paper (`ds-page` `column`, on `.ds1Paper`): it puts the device scale on, scrolls, keeps one
/// square around its content and stands its column on whole squares, at most `measure`
/// squares wide (`measure="N"`), centred in the room beside it. `bleed` (points at the base
/// scale, `--ds-page-bleed`) lets the content stand that far outside the column on each side,
/// the column's place and the grid's lines kept.
public struct DS1Page<Content: View>: View {
    let measure: CGFloat
    let grid: Bool
    let bleed: CGFloat
    let content: Content

    public init(measure: CGFloat = 32, grid: Bool = false, bleed: CGFloat = 0, @ViewBuilder content: () -> Content) {
        self.measure = measure
        self.grid = grid
        self.bleed = bleed
        self.content = content()
    }

    public var body: some View {
        Column(measure: measure, grid: grid, bleed: bleed, content: content).ds1Scaled()
    }

    struct Column: View {
        @Environment(\.ds1Scale) private var scale
        @Environment(\.ds1Paper) private var paper
        let measure: CGFloat
        let grid: Bool
        let bleed: CGFloat
        let content: Content

        @Environment(\.displayScale) private var pixels

        var body: some View {
            GeometryReader { geometry in
                let width = min(scale.squares(measure), scale.wholeSquares(in: geometry.size.width - 2 * scale.unit))
                // Centred, on a whole pixel, so the column's edge and the grid's lines meet exactly.
                let inset = ((geometry.size.width - width) / 2 * pixels).rounded(.down) / pixels
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) { content }
                        .frame(width: width + 2 * scale(bleed), alignment: .leading)
                        .padding(.vertical, scale.unit)
                        .padding(.leading, inset - scale(bleed))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .frame(minHeight: geometry.size.height, alignment: .top)
                        // The grid scrolls with the content and starts at the column's edge and
                        // its first square, so every row and every edge stands on its lines.
                        .background(alignment: .topLeading) {
                            if grid { DS1PaperGrid(origin: CGPoint(x: inset, y: 0)) }
                        }
                }
                .background { Rectangle().fill(paper).ignoresSafeArea() }
            }
        }
    }
}

/// The grid's lines on the paper, one square apart: through `origin` (a column's corner),
/// or centred on the view without one.
public struct DS1PaperGrid: View {
    @Environment(\.ds1Scale) private var scale
    let colour: DS1Color
    let origin: CGPoint?

    /// `--grid-color-light`: the ink at about a sixth.
    public init(_ colour: DS1Color = DS1Color.slate.withOpacity(0.169), origin: CGPoint? = nil) {
        self.colour = colour
        self.origin = origin
    }

    public var body: some View {
        Canvas { context, size in
            let step = scale.unit
            var path = Path()
            var x = (origin?.x ?? size.width / 2).truncatingRemainder(dividingBy: step)
            while x <= size.width {
                path.move(to: CGPoint(x: x, y: 0))
                path.addLine(to: CGPoint(x: x, y: size.height))
                x += step
            }
            var y = (origin?.y ?? 0).truncatingRemainder(dividingBy: step)
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
