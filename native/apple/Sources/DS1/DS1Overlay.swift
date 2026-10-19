import SwiftUI

/// `ds-overlay`'s box: 20 squares wide (the screen less a square at each side at most) on the
/// paper, a 1-point border, square corners and no shadow, a square of padding and a square
/// between its parts. Its `title` in the medium face, its `description` muted, the content,
/// then `footer` at the end. Show it with `.ds1Overlay(isPresented:)`.
public struct DS1OverlayBox<Content: View, Footer: View>: View {
    @Environment(\.ds1Paper) private var paper
    @Environment(\.ds1Scale) private var scale
    let title: String?
    let description: String?
    let onClose: (() -> Void)?
    let content: Content
    let footer: Footer

    public init(title: String? = nil, description: String? = nil, onClose: (() -> Void)? = nil, @ViewBuilder content: () -> Content, @ViewBuilder footer: () -> Footer) {
        self.title = title; self.description = description; self.onClose = onClose; self.content = content(); self.footer = footer()
    }

    public var body: some View {
        GeometryReader { g in
            VStack(alignment: .leading, spacing: scale.unit) {
                if title != nil || description != nil {
                    VStack(alignment: .leading, spacing: 0) {
                        if let title { DS1LineText(title, strong: true, wrap: true).accessibilityAddTraits(.isHeader) }
                        if let description { DS1LineText(description, tone: .muted, wrap: true) }
                    }
                    .padding(.trailing, onClose == nil ? 0 : scale.unit)
                }
                content
                HStack(spacing: scale.half) { Spacer(minLength: 0); footer }.frame(minHeight: scale.unit)
            }
            .padding(scale.unit)
            .frame(width: min(scale.squares(20), g.size.width - 2 * scale.unit), alignment: .leading)
            .background(paper)
            .overlay(Rectangle().strokeBorder(DS1Color.border, lineWidth: DS1Metrics.line))
            .overlay(alignment: .topTrailing) {
                if let onClose {
                    Button(action: onClose) { DS1Icon(.close) }.buttonStyle(.plain).padding(scale.unit)
                        .accessibilityLabel(DS1Words.shared.text("Close"))
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .accessibilityAddTraits(.isModal)
    }
}

private struct DS1OverlayPresenter<Box: View>: ViewModifier {
    @Binding var isPresented: Bool
    let closeOnOutside: Bool
    let box: () -> Box
    func body(content: Content) -> some View {
        content.overlay {
            if isPresented {
                ZStack {
                    Rectangle().fill(DS1Color.black.withOpacity(0.4)).ignoresSafeArea()
                        .onTapGesture { if closeOnOutside { isPresented = false } }
                        .accessibilityHidden(true)
                    box()
                }
                .transition(.opacity)
            }
        }
    }
}

extension View {
    /// Shows a dialog over this view on the page dimmed to 40% of the ink; a tap outside closes
    /// it unless `closeOnOutside` is false. Put it on the root so it covers the whole screen.
    public func ds1Overlay<Box: View>(isPresented: Binding<Bool>, closeOnOutside: Bool = true, @ViewBuilder _ box: @escaping () -> Box) -> some View {
        modifier(DS1OverlayPresenter(isPresented: isPresented, closeOnOutside: closeOnOutside, box: box))
    }
}

/// The page's own dialogs, as `alert()`, `confirm()` and `prompt()` on the web: one at a time,
/// the later ones waiting. `.ds1Theme()` shows them. The confirm button is primary; with
/// `danger` it is secondary in the danger colour and a tap outside does not cancel.
@MainActor
public final class DS1Overlays: ObservableObject {
    public static let shared = DS1Overlays()

    enum Kind { case alert, confirm(danger: Bool), prompt(label: String?, placeholder: String) }
    struct Request: Identifiable {
        let id = UUID()
        let kind: Kind
        let title: String
        let text: String?
        let confirm: String
        let cancel: String
        var value: String
        let done: (String?) -> Void
    }

    @Published var queue: [Request] = []

    public static func alert(_ title: String, text: String? = nil, confirm: String? = nil) async {
        _ = await withCheckedContinuation { c in
            shared.queue.append(Request(kind: .alert, title: title, text: text, confirm: confirm ?? DS1Words.shared.text("OK"), cancel: "", value: "") { c.resume(returning: $0) })
        }
    }

    public static func confirm(_ title: String, text: String? = nil, confirm: String? = nil, cancel: String? = nil, danger: Bool = false) async -> Bool {
        await withCheckedContinuation { c in
            shared.queue.append(Request(kind: .confirm(danger: danger), title: title, text: text, confirm: confirm ?? DS1Words.shared.text("OK"),
                                        cancel: cancel ?? DS1Words.shared.text("Cancel"), value: "") { c.resume(returning: $0 != nil) })
        }
    }

    public static func prompt(_ title: String, text: String? = nil, label: String? = nil, value: String = "", placeholder: String = "", confirm: String? = nil, cancel: String? = nil) async -> String? {
        await withCheckedContinuation { c in
            shared.queue.append(Request(kind: .prompt(label: label, placeholder: placeholder), title: title, text: text, confirm: confirm ?? DS1Words.shared.text("OK"),
                                        cancel: cancel ?? DS1Words.shared.text("Cancel"), value: value) { c.resume(returning: $0) })
        }
    }

    func finish(_ request: Request, _ value: String?) {
        queue.removeAll { $0.id == request.id }
        request.done(value)
    }
}

/// Shows `DS1Overlays`' requests one at a time. `.ds1Theme()` places it.
public struct DS1OverlayHost: View {
    @ObservedObject private var dialogs = DS1Overlays.shared
    @State private var value = ""
    public init() {}

    public var body: some View {
        if let request = dialogs.queue.first {
            let danger: Bool = { if case .confirm(let d) = request.kind { return d }; return false }()
            ZStack {
                Rectangle().fill(DS1Color.black.withOpacity(0.4)).ignoresSafeArea()
                    .onTapGesture { if !danger { dialogs.finish(request, nil) } }
                    .accessibilityHidden(true)
                DS1OverlayBox(title: request.title, description: request.text) {
                    if case .prompt(let label, let placeholder) = request.kind {
                        DS1Field(placeholder, text: $value, label: label).onSubmit { dialogs.finish(request, value) }
                    }
                } footer: {
                    switch request.kind {
                    case .alert:
                        Button(request.confirm) { dialogs.finish(request, "") }.buttonStyle(.ds1(.primary))
                    case .confirm(let danger):
                        Button(request.cancel) { dialogs.finish(request, nil) }.buttonStyle(.ds1(.secondary))
                        if danger {
                            DS1DangerButton(request.confirm) { dialogs.finish(request, "") }
                        } else {
                            Button(request.confirm) { dialogs.finish(request, "") }.buttonStyle(.ds1(.primary))
                        }
                    case .prompt:
                        Button(request.cancel) { dialogs.finish(request, nil) }.buttonStyle(.ds1(.secondary))
                        Button(request.confirm) { dialogs.finish(request, value) }.buttonStyle(.ds1(.primary))
                    }
                }
            }
            .onAppear { value = request.value }
            .id(request.id)
        }
    }
}
