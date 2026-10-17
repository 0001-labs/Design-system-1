import SwiftUI

/// `ds-input` for SwiftUI's `TextField` and `SecureField`: one square high on the field's
/// ground, text inset 4 points, the 4-point corner, in the field's colours.
public struct DS1FieldStyle: TextFieldStyle {
    public init() {}

    public func _body(configuration: TextField<Self._Label>) -> some View {
        Face(field: configuration)
    }

    struct Face<Field: View>: View {
        @Environment(\.ds1Scale) private var scale
        let field: Field

        var body: some View {
            field
                .font(DS1Font.font(.regular, size: scale.type))
                .tracking(scale.tracking)
                .foregroundStyle(DS1Color.inputText)
                .padding(.horizontal, scale(4))
                .frame(height: scale.unit)
                .background(DS1Color.inputBackground, in: RoundedRectangle(cornerRadius: scale.radius, style: .continuous))
        }
    }
}

extension TextFieldStyle where Self == DS1FieldStyle {
    public static var ds1: DS1FieldStyle { DS1FieldStyle() }
}
