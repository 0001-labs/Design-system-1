import SwiftUI

/// `ds-checkbox` for SwiftUI's `Toggle`: one square, a 1-point border, the corner; on, the
/// accent with the check in the ink on it. Use `Toggle(…).toggleStyle(.ds1Checkbox)`, or
/// `DS1Checkbox` for a mixed state.
public struct DS1CheckboxStyle: ToggleStyle {
    public init() {}
    public func makeBody(configuration: Configuration) -> some View {
        Button { configuration.isOn.toggle() } label: {
            HStack(spacing: 0) {
                DS1CheckboxBox(on: configuration.isOn, mixed: configuration.isMixed)
                configuration.label
            }
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(configuration.isOn ? [.isSelected] : [])
        .accessibilityValue(configuration.isMixed ? "mixed" : configuration.isOn ? "on" : "off")
    }
}

extension ToggleStyle where Self == DS1CheckboxStyle {
    public static var ds1Checkbox: DS1CheckboxStyle { DS1CheckboxStyle() }
}

/// A checkbox on its own, with `indeterminate` for a mixed state.
public struct DS1Checkbox: View {
    @Binding var isOn: Bool
    let indeterminate: Bool
    let label: String
    public init(_ label: String, isOn: Binding<Bool>, indeterminate: Bool = false) {
        self.label = label; _isOn = isOn; self.indeterminate = indeterminate
    }
    public var body: some View {
        Button { isOn.toggle() } label: { DS1CheckboxBox(on: isOn, mixed: indeterminate) }
            .buttonStyle(.plain)
            .accessibilityLabel(label)
            .accessibilityValue(indeterminate ? "mixed" : isOn ? "on" : "off")
            .accessibilityAddTraits(.isToggle)
    }
}

struct DS1CheckboxBox: View {
    @Environment(\.ds1Scale) private var scale
    @Environment(\.isEnabled) private var enabled
    let on: Bool
    let mixed: Bool
    var body: some View {
        let shape = RoundedRectangle(cornerRadius: scale.radius, style: .continuous)
        ZStack {
            shape.fill(on || mixed ? DS1Color.accent : DS1Color.inputBackground)
            shape.strokeBorder(DS1Color.border, lineWidth: DS1Metrics.line)
            if mixed { Rectangle().fill(DS1Color.onAccent).frame(width: scale(10), height: scale(2)) }
            else if on { DS1Icon(.check, size: .large).foregroundStyle(DS1Color.onAccent) }
        }
        .frame(width: scale.unit, height: scale.unit)
        .opacity(enabled ? 1 : 0.5)
    }
}

/// `ds-radio`: a one-square circle with a 10-point dot in the text colour when chosen.
public struct DS1Radio: View {
    @Environment(\.ds1Scale) private var scale
    @Environment(\.isEnabled) private var enabled
    let label: String
    let selected: Bool
    let action: () -> Void
    public init(_ label: String, selected: Bool, action: @escaping () -> Void) {
        self.label = label; self.selected = selected; self.action = action
    }
    public var body: some View {
        Button(action: action) {
            ZStack {
                Circle().fill(DS1Color.inputBackground)
                Circle().strokeBorder(DS1Color.border, lineWidth: DS1Metrics.line)
                if selected { Circle().fill(DS1Color.text).frame(width: scale(10), height: scale(10)) }
            }
            .frame(width: scale.unit, height: scale.unit)
            .opacity(enabled ? 1 : 0.5)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
    }
}

/// `ds-radio choice`: a labelled tile four squares by one (one with `compact`) on the field's
/// ground; the chosen tile's outline turns the text colour. With a `preview`, four by three.
public struct DS1Choice<Preview: View>: View {
    @Environment(\.ds1Paper) private var paper
    @Environment(\.ds1Scale) private var scale
    @Environment(\.isEnabled) private var enabled
    let label: String
    let selected: Bool
    let compact: Bool
    let action: () -> Void
    let preview: Preview?

    public init(_ label: String, selected: Bool, compact: Bool = false, action: @escaping () -> Void, @ViewBuilder preview: () -> Preview) {
        self.label = label; self.selected = selected; self.compact = compact; self.action = action; self.preview = preview()
    }

    public var body: some View {
        let shape = RoundedRectangle(cornerRadius: scale.radius, style: .continuous)
        Button(action: action) {
            VStack(spacing: 0) {
                if let preview { preview.frame(maxWidth: .infinity, maxHeight: .infinity) }
                DS1ControlText(label, colour: .text)
                    .padding(.horizontal, compact ? 0 : scale(4))
                    .frame(height: preview == nil ? scale.unit : scale(19))
            }
            .frame(width: compact ? scale.unit : scale.squares(4), height: preview == nil ? scale.unit : scale.squares(3))
            .background(enabled ? AnyShapeStyle(DS1Color.inputBackground) : AnyShapeStyle(paper.withOpacity(0.6)), in: shape)
            .overlay(shape.strokeBorder(selected ? DS1Color.text : DS1Color(0, opacity: 0), lineWidth: DS1Metrics.line))
            .opacity(enabled ? 1 : 0.5)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
    }
}

extension DS1Choice where Preview == EmptyView {
    public init(_ label: String, selected: Bool, compact: Bool = false, action: @escaping () -> Void) {
        self.label = label; self.selected = selected; self.compact = compact; self.action = action; self.preview = nil
    }
}

/// `ds-switch` for SwiftUI's `Toggle`: a 32 by 16 track and a 12-point thumb 2 in, with the
/// corner; on, the accent and the ink on it, sliding one control height in 140 ms. `rounded`
/// is the rounded switch: a pill with a white round thumb on dark Apple green.
public struct DS1SwitchStyle: ToggleStyle {
    let rounded: Bool
    public init(rounded: Bool = false) { self.rounded = rounded }
    public func makeBody(configuration: Configuration) -> some View { Face(configuration: configuration, rounded: rounded) }

    struct Face: View {
        @Environment(\.ds1Scale) private var scale
        @Environment(\.isEnabled) private var enabled
        @Environment(\.accessibilityReduceMotion) private var reduceMotion
        let configuration: Configuration
        let rounded: Bool
        var body: some View {
            let on = configuration.isOn
            let corner = rounded ? scale.control : scale.radius
            Button { configuration.isOn.toggle() } label: {
                HStack(spacing: scale(4)) {
                    configuration.label
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: corner, style: .continuous)
                            .fill(!on ? DS1Color.fill : rounded ? DS1Color(0x529d36) : DS1Color.accent)
                        Group {
                            if rounded { Circle().fill(DS1Color.white) }
                            else { RoundedRectangle(cornerRadius: scale.radius, style: .continuous).fill(on ? DS1Color.onAccent : DS1Color.textMuted) }
                        }
                        .frame(width: scale(12), height: scale(12))
                        .padding(scale(2))
                        .offset(x: on ? scale.control : 0)
                        .animation(reduceMotion ? nil : .easeInOut(duration: 0.14), value: on)
                    }
                    .frame(width: scale(32), height: scale.control)
                }
                .opacity(enabled ? 1 : 0.5)
            }
            .buttonStyle(.plain)
            .accessibilityValue(on ? "on" : "off")
            .accessibilityAddTraits(.isToggle)
        }
    }
}

extension ToggleStyle where Self == DS1SwitchStyle {
    public static var ds1Switch: DS1SwitchStyle { DS1SwitchStyle() }
    /// `rounded`: the rounded switch, a pill with a white round thumb.
    public static func ds1Switch(rounded: Bool) -> DS1SwitchStyle { DS1SwitchStyle(rounded: rounded) }
}

/// One segment of a split button or one tab: its value, its words, an icon, and whether it can be chosen.
public struct DS1Segment<Value: Hashable>: Identifiable {
    public let value: Value
    public let label: String
    public let icon: DS1IconName?
    public let enabled: Bool
    public var id: Value { value }
    public init(_ value: Value, _ label: String, icon: DS1IconName? = nil, enabled: Bool = true) {
        self.value = value; self.label = label; self.icon = icon; self.enabled = enabled
    }
}

/// `ds-button split`: segments on the fill one control high, 1 point apart, only the outer
/// corners rounded; the chosen one on the accent. Without a `selection` it is a row of
/// actions. `compact` squares one-letter labels.
public struct DS1SplitButton<Value: Hashable>: View {
    @Environment(\.ds1Scale) private var scale
    @Environment(\.isEnabled) private var enabled
    let segments: [DS1Segment<Value>]
    let selection: Value?
    let compact: Bool
    let action: (Value) -> Void

    public init(_ segments: [DS1Segment<Value>], selection: Value?, compact: Bool = false, action: @escaping (Value) -> Void) {
        self.segments = segments; self.selection = selection; self.compact = compact; self.action = action
    }

    public var body: some View {
        HStack(spacing: 1) {
            ForEach(Array(segments.enumerated()), id: \.element.id) { i, segment in
                let chosen = selection == segment.value
                let square = (segment.icon != nil && segment.label.isEmpty) || (compact && segment.label.count == 1)
                Button { if !chosen { action(segment.value) } } label: {
                    Group {
                        if let icon = segment.icon { DS1Icon(icon, size: .large) } else { DS1ControlText(segment.label, colour: chosen ? .onAccent : .textMuted) }
                    }
                    .foregroundStyle(chosen ? DS1Color.onAccent : DS1Color.textMuted)
                    .padding(.horizontal, square ? 0 : scale(compact ? 3 : 5))
                    .frame(minWidth: square ? scale.control : nil, maxWidth: square ? scale.control : nil, minHeight: scale.control, maxHeight: scale.control)
                    .background(chosen ? DS1Color.accent : DS1Color.fill, in: UnevenRoundedRectangle(
                        topLeadingRadius: i == 0 ? scale.radius : 0, bottomLeadingRadius: i == 0 ? scale.radius : 0,
                        bottomTrailingRadius: i == segments.count - 1 ? scale.radius : 0, topTrailingRadius: i == segments.count - 1 ? scale.radius : 0,
                        style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(!segment.enabled)
                .opacity(segment.enabled ? 1 : 0.5)
                .accessibilityLabel(segment.label)
                .accessibilityAddTraits(chosen ? [.isButton, .isSelected] : .isButton)
            }
        }
        .opacity(enabled ? 1 : 0.5)
    }
}

/// `ds-tabs`: tabs half a square apart on a row one square high, each one control high on no
/// ground and muted, the chosen one on the fill in the text colour. `segmented` puts them on
/// the fill one square high, the chosen one on the accent. `fill` gives each the same width.
public struct DS1Tabs<Value: Hashable>: View {
    @Environment(\.ds1Scale) private var scale
    let tabs: [DS1Segment<Value>]
    @Binding var selection: Value
    let segmented: Bool
    let fill: Bool

    public init(_ tabs: [DS1Segment<Value>], selection: Binding<Value>, segmented: Bool = false, fill: Bool = false) {
        self.tabs = tabs; _selection = selection; self.segmented = segmented; self.fill = fill
    }

    public var body: some View {
        HStack(spacing: scale(4)) {
            ForEach(tabs) { tab in
                let chosen = tab.value == selection
                Button { selection = tab.value } label: {
                    HStack(spacing: scale(4)) {
                        if let icon = tab.icon { DS1Icon(icon) }
                        if !tab.label.isEmpty { DS1ControlText(tab.label, colour: segmented && chosen ? .onAccent : segmented || chosen ? .text : .textMuted) }
                    }
                    .foregroundStyle(segmented && chosen ? DS1Color.onAccent : segmented || chosen ? DS1Color.text : DS1Color.textMuted)
                    .padding(.horizontal, scale(4))
                    .frame(maxWidth: fill ? .infinity : nil)
                    .frame(height: segmented ? scale.unit : scale.control)
                    .background(segmented ? (chosen ? DS1Color.accent : DS1Color.fill) : (chosen ? DS1Color.fill : DS1Color(0, opacity: 0)),
                                in: RoundedRectangle(cornerRadius: scale.radius, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(!tab.enabled)
                .accessibilityAddTraits(chosen ? [.isButton, .isSelected] : .isButton)
            }
        }
        .frame(height: scale.unit)
    }
}
