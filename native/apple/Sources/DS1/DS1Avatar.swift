import SwiftUI

/// `ds-avatar`'s sizes: one control (16), compact (the same) or large (two squares).
public enum DS1AvatarSize: Sendable {
    case regular, compact, large
    var points: CGFloat { self == .large ? 40 : DS1Metrics.control }
    var initial: CGFloat { self == .large ? 20 : 10 }
}

/// `ds-avatar`: a person's or a workspace's mark, always round unless `square` or a `logo`. A
/// `picture` covers it; without one it shows `initial` in an ink that reads on `colour`: black
/// on a light fill, white on a dark one. `pending` greys it. With a `label` it is an image for
/// VoiceOver, otherwise decorative.
public struct DS1Avatar: View {
    @Environment(\.ds1Scale) private var scale
    let initial: String
    let label: String?
    let picture: Image?
    let icon: DS1IconName?
    let colour: Color?
    let ink: Color?
    let size: DS1AvatarSize
    let square: Bool
    let logo: Bool
    let pending: Bool
    let outlined: Bool

    public init(initial: String = "?", label: String? = nil, picture: Image? = nil, icon: DS1IconName? = nil, colour: Color? = nil, ink: Color? = nil,
                size: DS1AvatarSize = .regular, square: Bool = false, logo: Bool = false, pending: Bool = false, outlined: Bool = false) {
        self.initial = initial; self.label = label; self.picture = picture; self.icon = icon; self.colour = colour; self.ink = ink
        self.size = size; self.square = square; self.logo = logo; self.pending = pending; self.outlined = outlined
    }

    public var body: some View {
        let box = scale(size.points)
        let shape = logo ? AnyShape(Rectangle()) : square ? AnyShape(RoundedRectangle(cornerRadius: scale.radius, style: .continuous)) : AnyShape(Circle())
        let letters: Color = pending ? DS1Color.textMuted.color : ink ?? colour.map { DS1Avatar.ink(on: $0).color } ?? DS1Color.text.color
        ZStack {
            shape.fill(pending ? DS1Color.fill.color : colour ?? DS1Color.fill.color)
            if let picture {
                picture.resizable().scaledToFill().saturation(pending ? 0 : 1).opacity(pending ? 0.5 : 1)
            } else if let icon {
                DS1Icon(icon, size: size == .large ? .large : .small).foregroundStyle(letters)
            } else {
                let count = max(1, initial.count)
                let type = count > 1 ? min(size == .large ? 14 : 10, (size.points - 2) / CGFloat(count)) : size.initial
                Text(initial).font(DS1Font.font(.regular, size: scale(type))).foregroundStyle(letters).lineLimit(1)
            }
            if outlined { shape.stroke(ink ?? letters, lineWidth: 1) }
        }
        .frame(width: box, height: box)
        .clipShape(shape)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label ?? "")
        .accessibilityHidden(label == nil)
    }

    /// The letters' ink on a fill: black where it is light (luminance above 0.22), white where it is dark.
    public static func ink(on fill: Color) -> DS1Color {
        #if canImport(UIKit)
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        UIColor(fill).getRed(&r, green: &g, blue: &b, alpha: &a)
        #else
        let c = NSColor(fill).usingColorSpace(.sRGB) ?? .black
        let (r, g, b) = (c.redComponent, c.greenComponent, c.blueComponent)
        #endif
        func linear(_ v: CGFloat) -> CGFloat { v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
        let luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
        return luminance > 0.22 ? DS1Color.black : DS1Color.white
    }
}

/// `ds-avatar-group`: avatars overlapping 3 points, the earlier ones on top, with an optional
/// `lead` 4 points before them.
public struct DS1AvatarGroup<Lead: View, Members: View>: View {
    @Environment(\.ds1Scale) private var scale
    let vertical: Bool
    let lead: Lead
    let members: Members
    public init(vertical: Bool = false, @ViewBuilder lead: () -> Lead, @ViewBuilder members: () -> Members) {
        self.vertical = vertical; self.lead = lead(); self.members = members()
    }
    public var body: some View {
        let layout = vertical ? AnyLayout(VStackLayout(spacing: scale(4))) : AnyLayout(HStackLayout(spacing: scale(4)))
        layout {
            lead
            Overlapping(vertical: vertical, overlap: scale(3)) {
                if #available(iOS 18, macOS 15, *) {
                    Group(subviews: members) { subviews in
                        ForEach(Array(subviews.enumerated()), id: \.offset) { i, member in member.zIndex(Double(subviews.count - i)) }
                    }
                } else { members }
            }
        }
    }
}

extension DS1AvatarGroup where Lead == EmptyView {
    public init(vertical: Bool = false, @ViewBuilder members: () -> Members) { self.init(vertical: vertical, lead: { EmptyView() }, members: members) }
}

/// Lays subviews out in a row (or a column), each `overlap` over the one before, the earlier on top.
struct Overlapping: Layout {
    let vertical: Bool
    let overlap: CGFloat
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let sizes = subviews.map { $0.sizeThatFits(.unspecified) }
        let along = sizes.map { vertical ? $0.height : $0.width }.reduce(0, +) - overlap * CGFloat(max(0, sizes.count - 1))
        let across = sizes.map { vertical ? $0.width : $0.height }.max() ?? 0
        return vertical ? CGSize(width: across, height: along) : CGSize(width: along, height: across)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var at: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            view.place(at: vertical ? CGPoint(x: bounds.midX - size.width / 2, y: bounds.minY + at) : CGPoint(x: bounds.minX + at, y: bounds.midY - size.height / 2), proposal: .unspecified)
            at += (vertical ? size.height : size.width) - overlap
        }
    }
}
