import SwiftUI

/// A row, an item, a header, a menu entry: one square high, square-cornered, its content
/// standing on the square. With `rule`, it stands on a 1-point line at its foot, as a table
/// row does (19 points of content and the line).
public struct DS1Row<Content: View>: View {
    @Environment(\.ds1Scale) private var scale
    let rule: Bool
    let spacing: CGFloat?
    let content: Content

    public init(rule: Bool = false, spacing: CGFloat? = nil, @ViewBuilder content: () -> Content) {
        self.rule = rule
        self.spacing = spacing
        self.content = content()
    }

    public var body: some View {
        HStack(spacing: spacing ?? scale(4)) { content }
            .frame(maxWidth: .infinity, minHeight: scale.unit, maxHeight: scale.unit, alignment: .leading)
            .overlay(alignment: .bottom) { if rule { DS1Rule() } }
    }
}

/// A 1-point line in the border colour, across the width it is given.
public struct DS1Rule: View {
    let colour: DS1Color
    public init(_ colour: DS1Color = .border) { self.colour = colour }
    public var body: some View {
        Rectangle().fill(colour).frame(height: DS1Metrics.line).accessibilityHidden(true)
    }
}
