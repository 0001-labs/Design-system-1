import SwiftUI

private struct DS1Tooltipped: ViewModifier {
    @Environment(\.ds1Scale) private var scale
    @State private var shown = false
    let text: String
    let colour: Color?

    func body(content: Content) -> some View {
        content
            #if os(macOS)
            .onHover { shown = $0 }
            #else
            .onLongPressGesture(minimumDuration: 0.4, perform: {}, onPressingChanged: { shown = $0 })
            #endif
            .overlay(alignment: .top) {
                if shown {
                    Text(DS1Font.attributed(text, scale: scale))
                        .foregroundStyle(colour != nil ? DS1Color.slate.color : DS1Color(light: 0xffffff, dark: 0x2a2a2a).color)
                        .lineLimit(nil)
                        .frame(maxWidth: scale(320))
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, scale(2.5))
                        .frame(minHeight: scale.control)
                        .background(colour.map { AnyShapeStyle($0) } ?? AnyShapeStyle(DS1Color(light: 0x2a2a2a, dark: 0xffffff)),
                                    in: RoundedRectangle(cornerRadius: scale(4), style: .continuous))
                        .fixedSize()
                        .alignmentGuide(.top) { $0[.bottom] + scale(2) }
                        .allowsHitTesting(false)
                        .accessibilityHidden(true)
                }
            }
            .accessibilityHint(text)
            #if os(macOS)
            .help(text)
            #endif
    }
}

extension View {
    /// `ds-tooltip`: a label 2 above the view, centred, one control high with 2.5 at the sides and
    /// the corner, wrapping past 320; under a pointer on a Mac, on a long press on iPhone and
    /// iPad. It is also the view's VoiceOver hint. Do not put essential information in it.
    public func ds1Tooltip(_ text: String, colour: Color? = nil) -> some View { modifier(DS1Tooltipped(text: text, colour: colour)) }
}
