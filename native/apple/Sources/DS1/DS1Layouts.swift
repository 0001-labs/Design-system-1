import SwiftUI

/// `ds-page`'s layouts, in whole squares: navigation 12 beside the main column (`sidebar`), a
/// list 16 beside its detail (`split`), navigation, main and a 12-square inspector
/// (`inspector`), one column of `measure` squares, 32 by default (`column`), one of 16 centred
/// both ways (`centered`), and the whole width for `DS1Tiles` (`tiles`).
public enum DS1PageLayoutKind: Sendable { case sidebar, split, inspector, column, centered, tiles }

/// A page in one of the standard layouts: a square of padding, two squares between columns
/// (a 1-point line in the middle when `divided`), every layout one column below 30 squares.
public struct DS1PageLayout<Nav: View, Main: View, Aside: View>: View {
    @Environment(\.ds1Scale) private var scale
    let kind: DS1PageLayoutKind
    let measure: CGFloat?
    let divided: Bool
    let nav: Nav
    let main: Main
    let aside: Aside

    public init(_ kind: DS1PageLayoutKind, measure: CGFloat? = nil, divided: Bool = false, @ViewBuilder nav: () -> Nav, @ViewBuilder main: () -> Main, @ViewBuilder aside: () -> Aside) {
        self.kind = kind; self.measure = measure; self.divided = divided; self.nav = nav(); self.main = main(); self.aside = aside()
    }

    public var body: some View {
        GeometryReader { g in
            let room = g.size.width - 2 * scale.unit
            let narrow = room < scale.squares(30)
            Group {
                if narrow || kind == .column || kind == .centered || kind == .tiles {
                    let width = narrow || kind == .tiles ? room : min(scale.squares(measure ?? (kind == .centered ? 16 : 32)), scale.wholeSquares(in: room))
                    ScrollView {
                        VStack(alignment: .leading, spacing: scale.unit) { nav; main; aside }
                            .frame(width: width, alignment: .leading)
                            .frame(maxWidth: .infinity, minHeight: kind == .centered && !narrow ? g.size.height - 2 * scale.unit : nil)
                    }
                } else {
                    HStack(alignment: .top, spacing: scale.squares(2)) {
                        ScrollView { nav }.frame(width: scale.squares(kind == .split ? 16 : 12)).overlay(alignment: .trailing) { if divided { line } }
                        ScrollView { main.frame(maxWidth: .infinity, alignment: .leading) }
                            .overlay(alignment: .trailing) { if divided && kind == .inspector { line } }
                        if kind == .inspector { ScrollView { aside }.frame(width: scale.squares(12)) }
                    }
                }
            }
            .padding(scale.unit)
        }
        .background(DS1Color.paper)
    }

    private var line: some View { Rectangle().fill(DS1Color.border).frame(width: DS1Metrics.line).offset(x: scale.unit) }
}

extension DS1PageLayout where Aside == EmptyView {
    public init(_ kind: DS1PageLayoutKind, measure: CGFloat? = nil, divided: Bool = false, @ViewBuilder nav: () -> Nav, @ViewBuilder main: () -> Main) {
        self.init(kind, measure: measure, divided: divided, nav: nav, main: main) { EmptyView() }
    }
}

extension DS1PageLayout where Nav == EmptyView, Aside == EmptyView {
    public init(_ kind: DS1PageLayoutKind, measure: CGFloat? = nil, @ViewBuilder main: () -> Main) {
        self.init(kind, measure: measure, divided: false, nav: { EmptyView() }, main: main) { EmptyView() }
    }
}

/// How much of a row a tile takes: one tile of 12 squares, two, or the whole row.
public enum DS1TileSpan: Sendable { case one, wide, full }

/// `ds-page tiles`' grid: tiles 12 squares wide a square apart, as many as fit a row.
public struct DS1Tiles<Content: View>: View {
    @Environment(\.ds1Scale) private var scale
    let content: Content
    public init(@ViewBuilder content: () -> Content) { self.content = content() }
    public var body: some View { DS1Flow(spacing: scale.unit) { content } }
}

extension View {
    /// One tile of `DS1Tiles`.
    public func ds1Tile(_ span: DS1TileSpan = .one) -> some View { modifier(DS1TileWidth(span: span)) }
}

private struct DS1TileWidth: ViewModifier {
    @Environment(\.ds1Scale) private var scale
    let span: DS1TileSpan
    func body(content: Content) -> some View {
        switch span {
        case .one: content.frame(width: scale.squares(12), alignment: .topLeading)
        case .wide: content.frame(width: scale.squares(25), alignment: .topLeading)
        case .full: content.frame(maxWidth: .infinity, alignment: .topLeading)
        }
    }
}
