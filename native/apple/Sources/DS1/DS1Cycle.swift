import SwiftUI

/// `ds-cycle`: a button that steps to the next of `values` on each press, wrapping round, its
/// label the current value's. Disabled when there is nothing to step to.
public struct DS1Cycle<Value: Equatable>: View {
    let values: [Value]
    let value: Value
    let label: (Value) -> String
    let kind: DS1ButtonStyle.Kind
    let onChange: (Value) -> Void

    public init(_ values: [Value], value: Value, kind: DS1ButtonStyle.Kind = .primary, label: @escaping (Value) -> String, onChange: @escaping (Value) -> Void) {
        self.values = values; self.value = value; self.kind = kind; self.label = label; self.onChange = onChange
    }

    public var body: some View {
        Button(label(value)) {
            guard let i = values.firstIndex(of: value), !values.isEmpty else { return }
            onChange(values[(i + 1) % values.count])
        }
        .buttonStyle(.ds1(kind))
        .disabled(!values.contains { $0 != value })
    }
}

/// The theme cycle: light, dark, system, saved with `DS1Preferences`.
public struct DS1ThemeCycle: View {
    @ObservedObject private var preferences = DS1Preferences.shared
    @ObservedObject private var words = DS1Words.shared
    public init() {}
    public var body: some View {
        DS1Cycle(DS1ThemeMode.allCases, value: preferences.theme, kind: .secondary, label: { $0.label }) { preferences.saveTheme($0) }
    }
}

/// `ds-language`: the language picker. Eight squares by one less the 1-point correction (four
/// with `compact`), on the fill, the current language named in itself; a press steps to the
/// next of the product's languages and saves it. `chip` hugs the name.
public struct DS1LanguagePicker: View {
    @Environment(\.ds1Scale) private var scale
    @ObservedObject private var words = DS1Words.shared
    let compact: Bool
    let chip: Bool
    let primary: Bool
    public init(compact: Bool = false, chip: Bool = false, primary: Bool = false) { self.compact = compact; self.chip = chip; self.primary = primary }

    public var body: some View {
        let name = words.language.nativeLabel
        Group {
            if chip {
                Button(name) { DS1Preferences.shared.saveLanguage(words.next()) }.buttonStyle(.ds1(primary ? .primary : .secondary))
            } else {
                Button { DS1Preferences.shared.saveLanguage(words.next()) } label: {
                    DS1ControlText(name, colour: primary ? .onAccent : .text)
                        .environment(\.locale, Locale(identifier: words.language.code))
                        .padding(.horizontal, scale(4))
                        .frame(width: scale.squares(compact ? 4 : 8) - DS1Metrics.line, height: scale.unit - DS1Metrics.line, alignment: .leading)
                        .background(primary ? DS1Color.accent : DS1Color.fill)
                }
                .buttonStyle(.plain)
            }
        }
        .accessibilityLabel("\(words.text("Language")): \(name)")
    }
}
