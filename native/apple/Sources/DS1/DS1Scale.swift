import SwiftUI

/// The device scale, `--sf` on the web: on an iPhone or iPad every measure is multiplied by
/// the screen's width over 280, between 0.75 and 2, rounded to three decimals; a Mac stays at 1.
/// Put it on once at the root with `.ds1Scaled()` and read it with
/// `@Environment(\.ds1Scale)`; every length is then `scale.unit`, `scale(16)` and so on.
public struct DS1Scale: Equatable, Sendable {
    public let factor: CGFloat
    /// The corner of pictures, buttons and fields at a scale of 1; an app may change it.
    public var corner: CGFloat = DS1Metrics.radius

    public init(factor: CGFloat) { self.factor = factor }

    /// The scale for a screen `width` points wide, as DS1/0-face/scaling.ts computes it.
    public static func device(width: CGFloat) -> DS1Scale {
        let clamped = min(DS1Metrics.scaleMax, max(DS1Metrics.scaleMin, width / DS1Metrics.scaleBase))
        let step = pow(10, CGFloat(DS1Metrics.scaleDecimals))
        return DS1Scale(factor: (clamped * step).rounded() / step)
    }

    /// A computer: everything at its own size.
    public static let desktop = DS1Scale(factor: 1)

    /// A length at this scale.
    public func callAsFunction(_ length: CGFloat) -> CGFloat { length * factor }
    /// A length of `squares` squares.
    public func squares(_ squares: CGFloat) -> CGFloat { squares * unit }

    public var unit: CGFloat { DS1Metrics.square * factor }
    public var half: CGFloat { DS1Metrics.half * factor }
    public var control: CGFloat { DS1Metrics.control * factor }
    public var row: CGFloat { DS1Metrics.row * factor }
    public var itemWidth: CGFloat { DS1Metrics.itemWidth * factor }
    public var itemHeight: CGFloat { DS1Metrics.itemHeight * factor }
    public var type: CGFloat { DS1Metrics.typeDefault * factor }
    public var small: CGFloat { DS1Metrics.typeSmall * factor }
    public var heading: CGFloat { DS1Metrics.typeHeading * factor }
    public var display: CGFloat { DS1Metrics.typeDisplay * factor }
    public var leading: CGFloat { DS1Metrics.leading * factor }
    public var tracking: CGFloat { DS1Metrics.tracking * factor }
    public var displayTracking: CGFloat { DS1Metrics.displayTracking * factor }
    /// Lines stay one point at every scale.
    public var line: CGFloat { DS1Metrics.line }
    public var radius: CGFloat { corner * factor }

    /// The widest whole number of squares that fits `width`.
    public func wholeSquares(in width: CGFloat) -> CGFloat { max(0, (width / unit).rounded(.down)) * unit }
}

private struct DS1ScaleKey: EnvironmentKey {
    static let defaultValue = DS1Scale.desktop
}

extension EnvironmentValues {
    public var ds1Scale: DS1Scale {
        get { self[DS1ScaleKey.self] }
        set { self[DS1ScaleKey.self] = newValue }
    }
}

private struct DS1Scaled: ViewModifier {
    let corner: CGFloat
    func body(content: Content) -> some View {
        GeometryReader { geometry in
            content.environment(\.ds1Scale, scale(width: geometry.size.width))
        }
    }
    private func scale(width: CGFloat) -> DS1Scale {
        #if os(macOS)
        var scale = DS1Scale.desktop
        #else
        var scale = DS1Scale.device(width: width)
        #endif
        scale.corner = corner
        return scale
    }
}

extension View {
    /// Puts the device scale on from the width this view is given: the screen's, at the root.
    public func ds1Scaled(corner: CGFloat = DS1Metrics.radius) -> some View {
        modifier(DS1Scaled(corner: corner))
    }
}
