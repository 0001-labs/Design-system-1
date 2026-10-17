import Foundation
import SwiftUI

/// Words in the reader's language, as the web's `translate()` finds them: the product's own
/// words over the shared ones, looked up in the language, its primary subtag, its relatives
/// (`nn` reads `nb`, `pt-BR` reads `pt`), then English, then the key itself. `{name}` and
/// `{{name}}` take `params`. Views that read `DS1Words.shared` update when the language
/// changes.
@MainActor
public final class DS1Words: ObservableObject {
    public static let shared = DS1Words()

    /// The language words are read in: the device's at start; set it from a saved choice.
    @Published public var language: DS1Language
    /// The languages the product speaks, in the order its picker shows them.
    @Published public var languages: [DS1Language] = DS1Language.allCases
    @Published private var productWords: [String: [String: String]] = [:]

    init() {
        language = Locale.preferredLanguages.lazy.compactMap { DS1Words.normalize($0) }.first ?? .en
    }

    /// The product's own words, `[language: [English words: text]]`; they win over the shared ones.
    public func register(_ words: [String: [String: String]]) {
        for (code, table) in words { productWords[code, default: [:]].merge(table) { _, new in new } }
    }

    /// The words for `key` in `language` (the current one by default), with `params` filled in.
    public func text(_ key: String, _ params: [String: CustomStringConvertible] = [:], language: DS1Language? = nil) -> String {
        let language = language ?? self.language
        var order = [language.code, String(language.code.split(separator: "-").first ?? "")] + language.related + ["en"]
        order = order.reduce(into: []) { if !$0.contains($1) { $0.append($1) } }
        let found = order.lazy.compactMap { self.productWords[$0]?[key] ?? DS1SharedWords.tables[$0]?[key] }.first
        return DS1Words.fill(found ?? key, params)
    }

    /// `{name}` and `{{name}}` in `text` replaced by `params`.
    public nonisolated static func fill(_ text: String, _ params: [String: CustomStringConvertible]) -> String {
        guard !params.isEmpty else { return text }
        let pattern = try! NSRegularExpression(pattern: #"\{\{?\s*([\w.-]+)\s*\}?\}"#)
        var result = text
        for match in pattern.matches(in: text, range: NSRange(text.startIndex..., in: text)).reversed() {
            guard let whole = Range(match.range, in: text), let name = Range(match.range(at: 1), in: text),
                  let value = params[String(text[name])] else { continue }
            result.replaceSubrange(whole, with: value.description)
        }
        return result
    }

    /// Any way of naming a language as one of the list (`da-DK`, `nb_NO`, `pt-br`), landing on
    /// one the product speaks: a relative stands in where it lacks the language itself.
    public nonisolated static func normalize(_ tag: String, allowed: [DS1Language] = DS1Language.allCases) -> DS1Language? {
        let normal = tag.trimmingCharacters(in: .whitespaces).lowercased().replacingOccurrences(of: "_", with: "-")
        let primary = String(normal.split(separator: "-").first ?? "")
        guard let member = DS1Language.allCases.first(where: { $0.code.lowercased() == normal || $0.aliases.contains(normal) })
            ?? DS1Language.allCases.first(where: { $0.code.lowercased() == primary }) else { return nil }
        if allowed.contains(member) { return member }
        return member.related.lazy.compactMap { code in allowed.first { $0.code == code } }.first
    }

    /// The language the picker steps to after the current one.
    public func next() -> DS1Language {
        guard let i = languages.firstIndex(of: language) else { return languages.first ?? .en }
        return languages[(i + 1) % languages.count]
    }
}
