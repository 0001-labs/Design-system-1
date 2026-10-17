import SwiftUI

/// A row, an item, a header, a menu entry: one square high, square-cornered, its content
/// standing on the lower sixteen of the square with the spare four above, as Ezo sets it: a
/// line of text, a 16-point icon and a control all end on the row's bottom line. With `rule`,
/// it stands on a 1-point line at its foot, as a table row does (19 points of content and
/// the line), the sixteen against the rule.
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
        HStack(alignment: .bottom, spacing: spacing ?? scale(4)) { content }
            .padding(.bottom, rule ? DS1Metrics.line : 0)
            .frame(maxWidth: .infinity, minHeight: scale.unit, maxHeight: scale.unit, alignment: .bottomLeading)
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
