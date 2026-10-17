import SwiftUI

/// What a toast reports.
public enum DS1ToastKind: Sendable { case message, success, info, warning, error, loading }

/// A toast's action or cancel: its words and what a press does. A press also closes the toast.
public struct DS1ToastAction {
    public let label: String
    public let action: () -> Void
    public init(_ label: String, action: @escaping () -> Void) { self.label = label; self.action = action }
}

/// One toast in the stack. Reusing an `id` updates it in place and restarts its time.
public struct DS1ToastItem: Identifiable {
    public let id: Int
    public var title: String
    public var description: String?
    public var kind: DS1ToastKind
    public var duration: TimeInterval
    public var action: DS1ToastAction?
    public var cancel: DS1ToastAction?
    public var dismissible: Bool
    var version = 0
}

/// Toasts, as `toast()` on the web: `DS1Toast.success("Saved")` from anywhere; `.ds1Theme()`
/// puts the stack on screen. Each stays 4 seconds (a loading toast until it is updated), paused
/// while a finger is on the stack; three show at once; a swipe toward the edge dismisses one.
@MainActor
public final class DS1Toast: ObservableObject {
    public static let shared = DS1Toast()
    public static let forever = TimeInterval.infinity
    public static let duration: TimeInterval = 4
    static let visible = 3
    @Published var items: [DS1ToastItem] = []
    private var counter = 0

    @discardableResult
    public static func show(_ title: String, description: String? = nil, kind: DS1ToastKind = .message, duration: TimeInterval? = nil, id: Int? = nil,
                            action: DS1ToastAction? = nil, cancel: DS1ToastAction? = nil, dismissible: Bool = true) -> Int {
        shared.show(title, description: description, kind: kind, duration: duration ?? (kind == .loading ? forever : Self.duration), id: id, action: action, cancel: cancel, dismissible: dismissible)
    }

    func show(_ title: String, description: String?, kind: DS1ToastKind, duration: TimeInterval, id: Int?, action: DS1ToastAction?, cancel: DS1ToastAction?, dismissible: Bool) -> Int {
        if let id, let i = items.firstIndex(where: { $0.id == id }) {
            items[i].title = title; items[i].description = description; items[i].kind = kind
            items[i].duration = duration; items[i].action = action; items[i].cancel = cancel; items[i].version += 1
            return id
        }
        counter += 1
        let item = DS1ToastItem(id: id ?? counter, title: title, description: description, kind: kind, duration: duration, action: action, cancel: cancel, dismissible: dismissible)
        withAnimation(.easeOut(duration: 0.4)) { items.insert(item, at: 0) }
        return item.id
    }

    @discardableResult public static func message(_ title: String, description: String? = nil) -> Int { show(title, description: description) }
    @discardableResult public static func success(_ title: String, description: String? = nil, id: Int? = nil) -> Int { show(title, description: description, kind: .success, id: id) }
    @discardableResult public static func info(_ title: String, description: String? = nil) -> Int { show(title, description: description, kind: .info) }
    @discardableResult public static func warning(_ title: String, description: String? = nil) -> Int { show(title, description: description, kind: .warning) }
    @discardableResult public static func error(_ title: String, description: String? = nil) -> Int { show(title, description: description, kind: .error) }
    @discardableResult public static func loading(_ title: String, description: String? = nil) -> Int { show(title, description: description, kind: .loading) }

    /// A loading toast while `work` runs, then its success or its error in the same place.
    public static func promise<T>(loading: String, success: @escaping (T) -> String, error: @escaping (Error) -> String, _ work: () async throws -> T) async throws -> T {
        let id = Self.loading(loading)
        do {
            let value = try await work()
            show(success(value), kind: .success, id: id)
            return value
        } catch let failure {
            show(error(failure), kind: .error, id: id)
            throw failure
        }
    }

    /// Dismisses one toast, or every toast.
    public static func dismiss(_ id: Int? = nil) {
        withAnimation(.easeIn(duration: 0.2)) { shared.items.removeAll { id == nil || $0.id == id } }
    }
}

/// The stack of toasts (`<ds-toast>`): at most 16 squares wide, a square from the edge and the
/// safe area. `.ds1Theme()` places one; place it yourself with `.ds1Theme(toasts: false)`.
public struct DS1ToastHost: View {
    @Environment(\.ds1Scale) private var scale
    @ObservedObject private var store = DS1Toast.shared
    @State private var held = false
    let top: Bool
    let richColours: Bool
    let closeButton: Bool
    public init(top: Bool = false, richColours: Bool = false, closeButton: Bool = false) { self.top = top; self.richColours = richColours; self.closeButton = closeButton }

    public var body: some View {
        VStack(alignment: .trailing, spacing: scale(4)) {
            if !top { Spacer(minLength: 0) }
            ForEach(Array(store.items.prefix(DS1Toast.visible).enumerated()), id: \.element.id) { index, item in
                DS1ToastChip(item: item, held: held, top: top, richColours: richColours, closeButton: closeButton)
                    .transition(.move(edge: top ? .top : .bottom).combined(with: .opacity))
            }
            if top { Spacer(minLength: 0) }
        }
        .frame(maxWidth: scale.squares(16), alignment: .trailing)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: top ? .topTrailing : .bottomTrailing)
        .padding(scale.unit)
        .simultaneousGesture(DragGesture(minimumDistance: 0).onChanged { _ in held = true }.onEnded { _ in held = false })
        .accessibilityElement(children: .contain)
        .accessibilityLabel(DS1Words.shared.text("Notifications"))
    }
}

struct DS1ToastChip: View {
    @Environment(\.ds1Scale) private var scale
    @State private var drag: CGFloat = 0
    let item: DS1ToastItem
    let held: Bool
    let top: Bool
    let richColours: Bool
    let closeButton: Bool

    var body: some View {
        let (ground, ink): (DS1Color, DS1Color) = switch (richColours, item.kind) {
        case (true, .success): (DS1Color(0x99ff73), DS1Color(0x2a2a2a))
        case (true, .info): (DS1Color(0xccccff), DS1Color(0x2a2a2a))
        case (true, .warning): (DS1Color(0xfec20d), DS1Color(0x2a2a2a))
        case (true, .error): (DS1Color(0xff5f5f), DS1Color(0x2a2a2a))
        default: (DS1Color(light: 0x2a2a2a, dark: 0xffffff), DS1Color(light: 0xffffff, dark: 0x2a2a2a))
        }
        let icon: DS1IconName? = switch item.kind {
        case .success: .check
        case .info: .notifications
        case .warning, .error: .warning
        default: nil
        }
        HStack(alignment: .top, spacing: scale(4)) {
            if item.kind == .loading { DS1Loading(.spinner, label: item.title).frame(width: scale.control, height: scale.control).scaleEffect(0.5) }
            else if let icon { DS1Icon(icon).foregroundStyle(ink).frame(width: scale.control, height: scale.control) }
            VStack(alignment: .leading, spacing: 0) {
                Text(DS1Font.attributed(item.title, scale: scale)).foregroundStyle(ink).frame(minHeight: scale.control)
                if let d = item.description { Text(DS1Font.attributed(d, scale: scale)).foregroundStyle(ink).opacity(0.7).frame(minHeight: scale.control) }
            }
            if let a = item.action { Button { a.action(); DS1Toast.dismiss(item.id) } label: { Text(DS1Font.attributed(a.label, scale: scale)).underline().foregroundStyle(ink) }.buttonStyle(.plain) }
            if let c = item.cancel { Button { c.action(); DS1Toast.dismiss(item.id) } label: { Text(DS1Font.attributed(c.label, scale: scale)).underline().foregroundStyle(ink).opacity(0.7) }.buttonStyle(.plain) }
            if closeButton && item.dismissible {
                Button { DS1Toast.dismiss(item.id) } label: { DS1Icon(.close).foregroundStyle(ink).frame(width: scale.control, height: scale.control) }
                    .buttonStyle(.plain).accessibilityLabel(DS1Words.shared.text("Close"))
            }
        }
        .padding(.horizontal, scale(4))
        .background(ground, in: RoundedRectangle(cornerRadius: scale.radius, style: .continuous))
        .offset(y: drag)
        .gesture(item.dismissible ? DragGesture().onChanged { drag = $0.translation.height }.onEnded { end in
            let toward = top ? -end.translation.height : end.translation.height
            let fast = (top ? -end.velocity.height : end.velocity.height) > 110
            if toward >= 45 || fast { DS1Toast.dismiss(item.id) } else { withAnimation(.easeOut(duration: 0.2)) { drag = 0 } }
        } : nil)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.updatesFrequently)
        .task(id: "\(item.version)-\(held)") {
            guard !held, item.duration.isFinite else { return }
            try? await Task.sleep(for: .seconds(item.duration))
            if !Task.isCancelled { DS1Toast.dismiss(item.id) }
        }
    }
}
