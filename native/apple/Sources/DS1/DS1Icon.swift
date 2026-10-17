import SwiftUI

/// An icon from Design system 1's library (DS1/x-icon), drawn as a vector template in the
/// text colour, as `.ds-icon` draws it as a mask in `currentColor`: 14 by default, 12 small,
/// 16 large, times the scale.
public struct DS1Icon: View {
    public enum Size: Sendable {
        case small, regular, large
        var points: CGFloat {
            switch self {
            case .small: 12
            case .regular: 14
            case .large: DS1Metrics.control
            }
        }
    }

    @Environment(\.ds1Scale) private var scale
    let name: DS1IconName
    let size: Size

    public init(_ name: DS1IconName, size: Size = .regular) {
        self.name = name
        self.size = size
    }

    public var body: some View {
        DS1Icon.image(name)
            .resizable()
            .renderingMode(.template)
            .interpolation(.high)
            .frame(width: scale(size.points), height: scale(size.points))
            .accessibilityHidden(true)
    }

    /// The icon's image in the package's catalogue.
    public static func image(_ name: DS1IconName) -> Image {
        Image(name.rawValue, bundle: .module)
    }
}
