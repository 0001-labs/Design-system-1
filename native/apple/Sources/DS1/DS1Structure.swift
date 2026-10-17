import SwiftUI

/// `ds-accordion`: a `summary` row one square high with a chevron that turns over in 140 ms;
/// open, the details follow half a square below. Twelve squares wide unless told otherwise.
public struct DS1Accordion<Details: View>: View {
    @Environment(\.ds1Scale) private var scale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let summary: String
    @Binding var isOpen: Bool
    let width: CGFloat?
    let details: Details

    public init(_ summary: String, isOpen: Binding<Bool>, width: CGFloat? = 12, @ViewBuilder details: () -> Details) {
        self.summary = summary; _isOpen = isOpen; self.width = width; self.details = details()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button { withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.14)) { isOpen.toggle() } } label: {
                HStack(spacing: scale(4)) {
                    DS1LineText(summary).frame(maxWidth: .infinity, alignment: .leading)
                    DS1Icon(.down).rotationEffect(.degrees(isOpen ? 180 : 0))
                }
                .frame(height: scale.unit)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityValue(isOpen ? "expanded" : "collapsed")
            if isOpen { details.padding(.top, scale.half).transition(.opacity) }
        }
        .frame(width: width.map { scale.squares($0) }, alignment: .leading)
    }
}

/// `ds-list`: rows edge to edge with no gap.
public struct DS1List<Content: View>: View {
    let content: Content
    public init(@ViewBuilder content: () -> Content) { self.content = content() }
    public var body: some View { VStack(alignment: .leading, spacing: 0) { content } }
}

/// `ds-panel`: a column on the paper with a pinned `header` and `footer` around a body that takes the rest.
public struct DS1Panel<Header: View, Body: View, Footer: View>: View {
    let header: Header
    let content: Body
    let footer: Footer
    public init(@ViewBuilder header: () -> Header, @ViewBuilder body: () -> Body, @ViewBuilder footer: () -> Footer) {
        self.header = header(); self.content = body(); self.footer = footer()
    }
    public var body: some View {
        VStack(spacing: 0) {
            header
            content.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            footer
        }
        .background(DS1Color.paper)
    }
}

/// A navigation entry of `DS1Sidebar`. Collapsed children are left out of the list.
public struct DS1SidebarItem: Identifiable, Sendable {
    public let id: String
    public let label: String
    public let icon: DS1IconName?
    public let depth: Int
    /// Whether it has children: true open, false closed, nil none.
    public let expanded: Bool?
    public let current: Bool
    public let enabled: Bool
    public let meta: String?
    public init(id: String, label: String, icon: DS1IconName? = nil, depth: Int = 0, expanded: Bool? = nil, current: Bool = false, enabled: Bool = true, meta: String? = nil) {
        self.id = id; self.label = label; self.icon = icon; self.depth = depth; self.expanded = expanded; self.current = current; self.enabled = enabled; self.meta = meta
    }
}

/// `ds-sidebar`: navigation 12 squares wide, rows one square high, each depth half a square
/// further in, a disclosure square for a section, the current row filled in the medium face.
public struct DS1Sidebar: View {
    @Environment(\.ds1Scale) private var scale
    let items: [DS1SidebarItem]
    let empty: String
    let onActivate: (String) -> Void
    let onToggle: (String, Bool) -> Void

    public init(_ items: [DS1SidebarItem], empty: String = "No items", onActivate: @escaping (String) -> Void, onToggle: @escaping (String, Bool) -> Void = { _, _ in }) {
        self.items = items; self.empty = empty; self.onActivate = onActivate; self.onToggle = onToggle
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if items.isEmpty { DS1LineText(empty, tone: .muted).padding(scale.half) }
            ForEach(items) { item in
                HStack(spacing: 0) {
                    Group {
                        if let expanded = item.expanded {
                            Button { onToggle(item.id, !expanded) } label: {
                                DS1Icon(.right).foregroundStyle(DS1Color.textMuted).rotationEffect(.degrees(expanded ? 90 : 0))
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("\(expanded ? "Collapse" : "Expand") \(item.label)")
                        } else { Color.clear }
                    }
                    .frame(width: scale.unit, height: scale.unit)
                    Button { onActivate(item.id) } label: {
                        HStack(spacing: scale(4)) {
                            if let icon = item.icon { DS1Icon(icon) }
                            DS1LineText(item.label, strong: item.current).frame(maxWidth: .infinity, alignment: .leading)
                            if let meta = item.meta { DS1LineText(meta, style: .small, tone: .muted, figures: true) }
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .disabled(!item.enabled)
                    .accessibilityAddTraits(item.current ? [.isButton, .isSelected] : .isButton)
                }
                .padding(.leading, scale(4) + scale.half * CGFloat(item.depth))
                .padding(.trailing, scale(4))
                .frame(height: scale.unit)
                .background(item.current ? DS1Color.fillHover : DS1Color(0, opacity: 0))
                .opacity(item.enabled ? 1 : 0.5)
            }
        }
        .padding(.vertical, scale.half)
        .frame(width: scale.squares(12), alignment: .leading)
    }
}

/// A column of `DS1Table`: its heading, how to read a row, and whether it holds numbers (set to the end).
public struct DS1Column<Row> {
    public let label: String
    public let numeric: Bool
    public let width: CGFloat?
    public let value: (Row) -> String
    public init(_ label: String, numeric: Bool = false, width: CGFloat? = nil, value: @escaping (Row) -> String) {
        self.label = label; self.numeric = numeric; self.width = width; self.value = value
    }
}

/// `ds-table`: rows one square high, 19 points of words on a 1-point rule, no box and no
/// column lines, half a square between columns, numbers to the end in tabular figures. The
/// headings are in the title colour. It scrolls sideways when it is wider than its room.
public struct DS1Table<Row>: View {
    @Environment(\.ds1Scale) private var scale
    let rows: [Row]
    let columns: [DS1Column<Row>]
    let selected: ((Row) -> Bool)?

    public init(_ rows: [Row], columns: [DS1Column<Row>], selected: ((Row) -> Bool)? = nil) { self.rows = rows; self.columns = columns; self.selected = selected }

    public var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            Grid(alignment: .bottomLeading, horizontalSpacing: scale.half, verticalSpacing: 0) {
                GridRow { ForEach(columns.indices, id: \.self) { i in cell(columns[i].label, columns[i], .title).accessibilityAddTraits(.isHeader) } }
                    .overlay(alignment: .bottom) { DS1Rule() }
                ForEach(rows.indices, id: \.self) { r in
                    let on = selected?(rows[r]) == true
                    GridRow { ForEach(columns.indices, id: \.self) { i in cell(columns[i].value(rows[r]), columns[i], on ? .onAccent : .text) } }
                        .background(on ? DS1Color.accent : DS1Color(0, opacity: 0))
                        .overlay(alignment: .bottom) { DS1Rule() }
                }
            }
        }
    }

    private func cell(_ text: String, _ column: DS1Column<Row>, _ ink: DS1Color) -> some View {
        Text(DS1Font.attributed(text, scale: scale))
            .monospacedDigit()
            .foregroundStyle(ink)
            .lineLimit(1)
            .frame(width: column.width.map { scale($0) }, alignment: column.numeric ? .trailing : .leading)
            .frame(height: scale.unit, alignment: .bottom)
            .gridColumnAlignment(column.numeric ? .trailing : .leading)
    }
}

/// `ds-token-field`: chosen values as `DS1Token`s and a field to type the next, wrapping a
/// square at a time inside a 1-point outline on the paper. Return or a `separators` character
/// asks to commit the text; deleting in an empty field asks to remove the last token.
public struct DS1TokenField<Tokens: View>: View {
    @Environment(\.ds1Scale) private var scale
    @FocusState private var focused: Bool
    @Binding var text: String
    let placeholder: String
    let separators: String
    let onCommit: (String) -> Void
    let tokens: Tokens

    public init(_ placeholder: String = "", text: Binding<String>, separators: String = ",;", onCommit: @escaping (String) -> Void, @ViewBuilder tokens: () -> Tokens) {
        self.placeholder = placeholder; _text = text; self.separators = separators; self.onCommit = onCommit; self.tokens = tokens()
    }

    public var body: some View {
        DS1Flow(spacing: scale.half) {
            tokens
            TextField(placeholder, text: $text)
                .focused($focused)
                .font(DS1Font.font(.regular, size: scale.type))
                .tracking(scale.tracking)
                .textFieldStyle(.plain)
                .padding(.horizontal, scale(4))
                .frame(minWidth: scale.squares(4), idealWidth: scale.squares(8), minHeight: scale.unit, maxHeight: scale.unit)
                .onSubmit { commit(text) }
                .onChange(of: text) { _, value in
                    if let cut = value.firstIndex(where: { separators.contains($0) }) {
                        commit(String(value[..<cut]))
                        text = String(value[value.index(after: cut)...]).trimmingCharacters(in: .whitespaces)
                    }
                }
        }
        .frame(maxWidth: .infinity, minHeight: scale.unit, alignment: .leading)
        .background(DS1Color.paper, in: RoundedRectangle(cornerRadius: scale.radius, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: scale.radius, style: .continuous).strokeBorder(focused ? DS1Color.focusRing : DS1Color.border, lineWidth: DS1Metrics.line))
    }

    private func commit(_ value: String) {
        let trimmed = value.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty { onCommit(trimmed) }
        if value == text { text = "" }
    }
}

/// Lays out views in rows, wrapping to the next row when one is full.
public struct DS1Flow: Layout {
    let spacing: CGFloat
    public init(spacing: CGFloat) { self.spacing = spacing }
    public func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, row: CGFloat = 0, widest: CGFloat = 0
        for view in subviews {
            let s = view.sizeThatFits(.unspecified)
            if x > 0 && x + s.width > width { y += row; x = 0; row = 0 }
            x += s.width + spacing; row = max(row, s.height); widest = max(widest, x - spacing)
        }
        return CGSize(width: proposal.width ?? widest, height: y + row)
    }
    public func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, row: CGFloat = 0
        for view in subviews {
            let s = view.sizeThatFits(.unspecified)
            if x > bounds.minX && x + s.width > bounds.maxX { y += row; x = bounds.minX; row = 0 }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(s))
            x += s.width + spacing; row = max(row, s.height)
        }
    }
}
