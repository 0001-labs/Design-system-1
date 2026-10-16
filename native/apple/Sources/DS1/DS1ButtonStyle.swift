import SwiftUI

/// `ds-button` for SwiftUI's `Button`: one control high, hugging its label, with the 4-point
/// corner; `plain` on the paper, `secondary` on the fill, `primary` on the accent. Pressed
/// and disabled states change only opacity.
public struct DS1ButtonStyle: ButtonStyle {
    public enum Kind: Sendable { case plain, secondary, primary }

    let kind: Kind
    public init(_ kind: Kind = .plain) { self.kind = kind }

    public func makeBody(configuration: Configuration) -> some View {
        Face(configuration: configuration, kind: kind)
    }

    struct Face: View {
        @Environment(\.ds1Scale) private var scale
        @Environment(\.isEnabled) private var enabled
        let configuration: Configuration
        let kind: Kind

        var body: some View {
            configuration.label
                .font(DS1Font.font(.regular, size: scale.type))
                .tracking(scale.tracking)
                .lineLimit(1)
                .foregroundStyle(kind == .primary ? DS1Color.onAccent : DS1Color.text)
                .padding(.horizontal, kind == .plain ? 0 : scale(4))
                .frame(height: scale.control)
                .background(background, in: RoundedRectangle(cornerRadius: scale.radius, style: .continuous))
                .contentShape(Rectangle())
                .opacity(!enabled ? 0.5 : configuration.isPressed ? 0.7 : 1)
        }

        private var background: DS1Color {
            switch kind {
            case .plain: DS1Color(0x000000, opacity: 0)
            case .secondary: .fill
            case .primary: .accent
            }
        }
    }
}

extension ButtonStyle where Self == DS1ButtonStyle {
    public static var ds1: DS1ButtonStyle { DS1ButtonStyle() }
    public static func ds1(_ kind: DS1ButtonStyle.Kind) -> DS1ButtonStyle { DS1ButtonStyle(kind) }
}
