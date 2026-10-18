import SwiftUI

/// `ds-input`'s faces: `field` (the default for a field on its own: the fill, a 1-point border
/// and the corner), `row` (an 18-point field in a 20-point settings row, on the field's ground,
/// square) and `plain` (words alone).
public enum DS1FieldVariant: Sendable { case field, row, plain }

/// `ds-input`: one square high, text inset 4, with an optional `label` above (a required field
/// adds " *" in the danger colour), an `error` below on its own lines, and for a `secure` field
/// a button that shows and hides the password. `rows` makes it the multiline field (`multiline`):
/// the field's look across that many lines one square tall, growing with its text a line at a
/// time up to `maxRows` with `autoGrow`, then scrolling.
public struct DS1Field: View {
    @Environment(\.ds1Scale) private var scale
    @Environment(\.isEnabled) private var enabled
    @FocusState private var focused: Bool
    @State private var revealed = false
    @Binding var text: String
    let placeholder: String
    let label: String?
    let error: String?
    let required: Bool
    let variant: DS1FieldVariant
    let secure: Bool
    let quietFocus: Bool
    let rows: Int?
    let maxRows: Int
    let autoGrow: Bool

    public init(_ placeholder: String = "", text: Binding<String>, label: String? = nil, error: String? = nil, required: Bool = false,
                variant: DS1FieldVariant = .field, secure: Bool = false, quietFocus: Bool = false,
                rows: Int? = nil, autoGrow: Bool = false, maxRows: Int = 10) {
        self.placeholder = placeholder; _text = text; self.label = label; self.error = error; self.required = required
        self.variant = variant; self.secure = secure; self.quietFocus = quietFocus
        self.rows = rows.map { max(1, $0) }; self.autoGrow = autoGrow; self.maxRows = max(rows ?? 1, maxRows)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let label {
                (Text(DS1Font.attributed(label, scale: scale)) + Text(required ? " *" : "").foregroundColor(DS1Color.danger.color))
                    .foregroundStyle(DS1Color.text)
                    .frame(height: scale.unit)
            }
            HStack(spacing: 0) {
                Group {
                    if let rows {
                        TextField(placeholder, text: $text, axis: .vertical)
                            .lineLimit(autoGrow ? rows ... maxRows : rows ... rows)
                            .lineSpacing(max(0, scale.unit - DS1Font.lineHeight(.regular, size: scale.type)))
                    } else if secure && !revealed { SecureField(placeholder, text: $text) } else { TextField(placeholder, text: $text) }
                }
                .focused($focused)
                .font(DS1Font.font(.regular, size: scale.type))
                .tracking(scale.tracking)
                .foregroundStyle(variant == .row ? DS1Color.inputText : DS1Color.text)
                .textFieldStyle(.plain)
                if secure {
                    Button { revealed.toggle() } label: {
                        DS1Icon(revealed ? .passwordUnsee : .passwordSee, size: .large).foregroundStyle(DS1Color(light: 0x1e1e1e, dark: 0xf5f5f5))
                            .frame(width: scale(24), height: scale.unit)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(DS1Words.shared.text(revealed ? "Hide password" : "Show password"))
                }
            }
            .padding(.leading, variant == .plain ? 0 : scale(4))
            .padding(.trailing, variant == .plain || secure ? 0 : scale(4))
            .padding(.vertical, rows == nil || variant == .plain ? 0 : scale(4))
            .frame(height: rows == nil ? (variant == .row ? scale(18) : scale.unit) : nil)
            .frame(minHeight: rows.map { scale.squares(CGFloat($0)) }, alignment: .topLeading)
            .background(ground, in: RoundedRectangle(cornerRadius: variant == .field ? scale.radius : 0, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: variant == .field ? scale.radius : 0, style: .continuous).strokeBorder(line, lineWidth: DS1Metrics.line))
            .padding(.top, variant == .row ? scale(2) : 0)
            .opacity(enabled || variant == .row ? 1 : 0.5)
            if let error {
                DS1LineText(error, tone: .danger, wrap: true).accessibilityAddTraits(.updatesFrequently)
            }
        }
    }

    private var ground: DS1Color {
        switch variant {
        case .field: .fill
        case .row: .inputBackground
        case .plain: DS1Color(0, opacity: 0)
        }
    }

    private var line: DS1Color {
        if variant == .plain { return DS1Color(0, opacity: 0) }
        if focused && !quietFocus { return variant == .row ? .accent : .focusRing }
        if error != nil { return .danger }
        return variant == .field ? .border : DS1Color(0, opacity: 0)
    }
}
