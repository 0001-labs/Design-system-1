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

/// A normal button that fits the language name. Legacy compact and chip arguments remain compatible.
public struct DS1LanguageCycle: View {
    @ObservedObject private var words = DS1Words.shared
    let primary: Bool
    public init(compact: Bool = false, chip: Bool = false, primary: Bool = false) { self.primary = primary }

    public var body: some View {
        let name = words.language.nativeLabel
        Button(name) { DS1Preferences.shared.saveLanguage(words.next()) }
            .buttonStyle(.ds1(primary ? .primary : .secondary))
            .environment(\.locale, Locale(identifier: words.language.code))
            .accessibilityLabel("\(words.text("Language")): \(name)")
    }
}
