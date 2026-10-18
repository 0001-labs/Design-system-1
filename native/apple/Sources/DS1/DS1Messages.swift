import SwiftUI

/// `ds-notice`'s tones.
public enum DS1NoticeTone: Sendable {
    case neutral, success, warning, danger
    var icon: DS1IconName { self == .neutral ? .info : self == .success ? .check : .warning }
    var mark: DS1Color {
        switch self {
        case .neutral: .fill
        case .success: DS1Color(0x99ff73)
        case .warning: DS1Color(0xfec20d)
        case .danger: .danger
        }
    }
    var markInk: DS1Color {
        switch self {
        case .neutral: .text
        case .success, .warning: DS1Color(0x2a2a2a)
        case .danger: DS1Color(light: 0xffffff, dark: 0x2a2a2a)
        }
    }
}

/// `ds-notice`: a message in the flow, beside what it is about. A one-square mark in its tone,
/// the `heading` in the medium face and the `text`, every line one square, and `actions` a
/// square below. `onDismiss` adds a close button. With `banner` it is a strip one square high
/// across the top instead, on a fill of the tone's colour, everything on one line, the actions
/// at the line's end.
public struct DS1Notice<Actions: View>: View {
    @Environment(\.ds1Scale) private var scale
    let tone: DS1NoticeTone
    let heading: String?
    let text: String?
    let icon: DS1IconName?
    let banner: Bool
    let onDismiss: (() -> Void)?
    let actions: Actions

    public init(tone: DS1NoticeTone = .neutral, heading: String? = nil, text: String? = nil, icon: DS1IconName? = nil, banner: Bool = false, onDismiss: (() -> Void)? = nil, @ViewBuilder actions: () -> Actions) {
        self.tone = tone; self.heading = heading; self.text = text; self.icon = icon; self.banner = banner; self.onDismiss = onDismiss; self.actions = actions()
    }

    public var body: some View {
        if banner { strip } else { block }
    }

    private var strip: some View {
        HStack(spacing: scale(4)) {
            DS1Icon(icon ?? tone.icon, size: .large).foregroundStyle(tone.markInk)
                .frame(width: scale.control, height: scale.control).background(tone.mark)
            if let heading { DS1ControlText(heading, colour: .text) }
            if let text { DS1ControlText(text, colour: .text).frame(maxWidth: .infinity, alignment: .leading) }
            if Actions.self != EmptyView.self { HStack(spacing: scale.half) { actions } }
            if let onDismiss {
                Button(action: onDismiss) { DS1Icon(.close, size: .large).foregroundStyle(DS1Color.text) }.buttonStyle(.plain)
                    .accessibilityLabel(DS1Words.shared.text("Close"))
            }
        }
        .padding(.horizontal, scale.unit)
        .frame(height: scale.unit)
        .background(tone.mark.color.opacity(0.4))
        .accessibilityElement(children: .combine)
    }

    private var block: some View {
        HStack(alignment: .top, spacing: 0) {
            DS1Icon(icon ?? tone.icon, size: .large).foregroundStyle(tone.markInk)
                .frame(width: scale.control, height: scale.control).background(tone.mark)
                .frame(width: scale.unit, height: scale.unit)
            VStack(alignment: .leading, spacing: 0) {
                if let heading { DS1LineText(heading, tone: tone == .danger ? .danger : .text, strong: true, wrap: true) }
                if let text { DS1LineText(text, tone: tone == .danger ? .danger : .text, wrap: true) }
                if Actions.self != EmptyView.self { HStack(spacing: scale.half) { actions }.frame(minHeight: scale.unit) }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            if let onDismiss {
                Button(action: onDismiss) { DS1Icon(.close).frame(width: scale.control, height: scale.unit) }
                    .buttonStyle(.plain).padding(.leading, scale(4))
                    .accessibilityLabel(DS1Words.shared.text("Close"))
            }
        }
        .accessibilityElement(children: .combine)
    }
}

extension DS1Notice where Actions == EmptyView {
    public init(tone: DS1NoticeTone = .neutral, heading: String? = nil, text: String? = nil, icon: DS1IconName? = nil, banner: Bool = false, onDismiss: (() -> Void)? = nil) {
        self.init(tone: tone, heading: heading, text: text, icon: icon, banner: banner, onDismiss: onDismiss) { EmptyView() }
    }
}

/// `ds-empty`: an empty place saying what fills it. An optional `icon` on its own square, the
/// `heading` in the medium face, the `text` muted, every line one square, at most 16 squares
/// wide; `actions` a square below.
public struct DS1Empty<Actions: View>: View {
    @Environment(\.ds1Scale) private var scale
    let heading: String?
    let text: String?
    let icon: DS1IconName?
    let centered: Bool
    let actions: Actions

    public init(heading: String? = nil, text: String? = nil, icon: DS1IconName? = nil, centered: Bool = false, @ViewBuilder actions: () -> Actions) {
        self.heading = heading; self.text = text; self.icon = icon; self.centered = centered; self.actions = actions()
    }

    public var body: some View {
        VStack(alignment: centered ? .center : .leading, spacing: 0) {
            if let icon { DS1Icon(icon, size: .large).foregroundStyle(DS1Color.textMuted).frame(height: scale.unit) }
            DS1LineText(heading ?? DS1Words.shared.text("Nothing here yet"), strong: true, wrap: true).accessibilityAddTraits(.isHeader)
            if let text { DS1LineText(text, tone: .muted, wrap: true) }
            if Actions.self != EmptyView.self { HStack(spacing: scale.half) { actions }.frame(minHeight: scale.unit).padding(.top, scale.unit) }
        }
        .multilineTextAlignment(centered ? .center : .leading)
        .frame(maxWidth: scale.squares(16), alignment: centered ? .center : .leading)
    }
}

extension DS1Empty where Actions == EmptyView {
    public init(heading: String? = nil, text: String? = nil, icon: DS1IconName? = nil, centered: Bool = false) {
        self.init(heading: heading, text: text, icon: icon, centered: centered) { EmptyView() }
    }
}

/// `ds-loading`'s two faces.
public enum DS1LoadingVariant: Sendable { case bar, spinner }

/// `ds-loading`: a status that something is on its way. The bar is three squares by 2 points,
/// its fill sliding across in 1.8 s; the spinner one square, turning in 0.72 s. With reduce
/// motion they stand still.
public struct DS1Loading: View {
    @Environment(\.ds1Scale) private var scale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let variant: DS1LoadingVariant
    let label: String
    public init(_ variant: DS1LoadingVariant = .bar, label: String = "Loading") { self.variant = variant; self.label = label }

    public var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { context in
            let t = context.date.timeIntervalSinceReferenceDate
            switch variant {
            case .bar:
                let phase = reduceMotion ? 0 : (t.truncatingRemainder(dividingBy: 1.8) / 1.8)
                let eased = phase < 0.5 ? 2 * phase * phase : 1 - pow(-2 * phase + 2, 2) / 2
                Capsule().fill(.primary.opacity(0.16))
                    .overlay(alignment: .leading) {
                        GeometryReader { g in
                            Capsule().fill(.primary).opacity(reduceMotion ? 0.65 : 1).offset(x: (eased * 2 - 1) * g.size.width)
                        }
                    }
                    .clipShape(Capsule())
                    .frame(width: scale.squares(3), height: 2)
            case .spinner:
                let turn = reduceMotion ? 0 : (t.truncatingRemainder(dividingBy: 0.72) / 0.72) * 360
                ZStack {
                    Circle().stroke(.primary.opacity(0.18), lineWidth: 2)
                    Circle().trim(from: 0, to: 0.25).stroke(.primary, lineWidth: 2).rotationEffect(.degrees(turn))
                }
                .frame(width: scale.unit - 2, height: scale.unit - 2)
                .frame(width: scale.unit, height: scale.unit)
            }
        }
        .accessibilityElement()
        .accessibilityLabel(label)
        .accessibilityAddTraits(.updatesFrequently)
    }
}
