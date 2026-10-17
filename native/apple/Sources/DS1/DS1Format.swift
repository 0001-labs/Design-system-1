import Foundation
#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif

/// Dates, numbers and money in the reader's language, as format.ts and pricing.ts on the web:
/// the same locales for each language, a date-only value staying on its day in every zone,
/// and the same steps for relative time.
@MainActor
public enum DS1Format {
    /// The locale format.ts uses for each language.
    public static let locales: [DS1Language: String] = [
        .da: "da-DK", .de: "de-DE", .en: "en-US", .es: "es-ES", .fi: "fi-FI", .fr: "fr-FR", .is: "is-IS", .it: "it-IT",
        .ja: "ja-JP", .ko: "ko-KR", .nb: "nb-NO", .nn: "nn-NO", .no: "no-NO", .pt: "pt-PT", .ptBR: "pt-BR", .sv: "sv-SE", .zh: "zh-CN",
    ]
    public static var locale: Locale { Locale(identifier: locales[DS1Words.shared.language] ?? "en-US") }
    public static var timeZone: TimeZone = .current

    public enum Length: Sendable { case short, medium, long }
    private static func style(_ l: Length) -> DateFormatter.Style { l == .short ? .short : l == .medium ? .medium : .long }

    public static func date(_ date: Date, _ length: Length = .medium) -> String {
        let f = DateFormatter(); f.locale = locale; f.timeZone = timeZone; f.dateStyle = style(length); f.timeStyle = .none
        return f.string(from: date)
    }
    /// A date-only value (`2026-10-17`) on its own day, whatever the time zone.
    public static func date(day: DateComponents, _ length: Length = .medium) -> String {
        var calendar = Calendar(identifier: .gregorian); calendar.timeZone = TimeZone(identifier: "UTC")!
        let f = DateFormatter(); f.locale = locale; f.timeZone = calendar.timeZone; f.dateStyle = style(length)
        return f.string(from: calendar.date(from: day) ?? Date())
    }
    public static func time(_ date: Date, _ length: Length = .short) -> String {
        let f = DateFormatter(); f.locale = locale; f.timeZone = timeZone; f.dateStyle = .none; f.timeStyle = style(length)
        return f.string(from: date)
    }
    public static func dateTime(_ date: Date, _ length: Length = .medium) -> String {
        let f = DateFormatter(); f.locale = locale; f.timeZone = timeZone; f.dateStyle = style(length); f.timeStyle = .short
        return f.string(from: date)
    }
    public static func monthYear(_ date: Date) -> String { template("MMMMy", date) }
    public static func monthDay(_ date: Date) -> String { template("MMMMd", date) }
    private static func template(_ t: String, _ date: Date) -> String {
        let f = DateFormatter(); f.locale = locale; f.timeZone = timeZone; f.setLocalizedDateFormatFromTemplate(t)
        return f.string(from: date)
    }

    public static func number(_ value: Double, digits: Int? = nil) -> String {
        let f = NumberFormatter(); f.locale = locale; f.numberStyle = .decimal
        if let digits { f.minimumFractionDigits = digits; f.maximumFractionDigits = digits }
        return f.string(from: value as NSNumber) ?? "\(value)"
    }
    public static func percent(_ fraction: Double, digits: Int = 0) -> String {
        let f = NumberFormatter(); f.locale = locale; f.numberStyle = .percent; f.maximumFractionDigits = digits
        return f.string(from: fraction as NSNumber) ?? "\(fraction)"
    }
    public static func compact(_ value: Double) -> String { value.formatted(.number.notation(.compactName).locale(locale)) }
    public static func list(_ items: [String]) -> String { items.formatted(.list(type: .and).locale(locale)) }

    /// An amount of money: `minor` when it is in the currency's smallest unit (øre, cents),
    /// `whole` to leave out a zero fraction.
    public static func money(_ amount: Double, currency: String, minor: Bool = false, whole: Bool = false) -> String {
        let f = NumberFormatter(); f.locale = locale; f.numberStyle = .currency; f.currencyCode = currency
        let value = minor ? amount / pow(10, Double(f.maximumFractionDigits)) : amount
        if whole && value.rounded() == value { f.minimumFractionDigits = 0; f.maximumFractionDigits = 0 }
        return f.string(from: value as NSNumber) ?? "\(value) \(currency)"
    }

    /// The steps of relative time.
    public enum Unit: Sendable, Equatable { case minute, hour, day, week, month, year }

    /// The step and its signed count, or nil for "now": under 45 seconds now, minutes under 45
    /// minutes, hours under 22 (or the same day), days under a week, weeks under 26 days,
    /// months under 335 days, then years.
    public nonisolated static func relativeStep(seconds: Int, then: Date, now: Date, calendar: Calendar = .current) -> (count: Int, unit: Unit)? {
        let a = abs(seconds), sign = seconds < 0 ? -1 : 1
        let days = calendar.dateComponents([.day], from: calendar.startOfDay(for: now), to: calendar.startOfDay(for: then)).day ?? 0
        if a < 45 { return nil }
        if a < 45 * 60 { return (sign * Int((Double(a) / 60).rounded()), .minute) }
        if a < 22 * 3600 || calendar.isDate(then, inSameDayAs: now) { return (sign * Int((Double(a) / 3600).rounded()), .hour) }
        if abs(days) < 7 { return (days, .day) }
        if abs(days) < 26 { return (sign * Int((Double(abs(days)) / 7).rounded()), .week) }
        if abs(days) < 335 { return (sign * Int((Double(abs(days)) / 30.44).rounded()), .month) }
        return (sign * Int((Double(abs(days)) / 365.25).rounded()), .year)
    }

    /// How long ago or how soon, in those steps.
    public static func relative(_ date: Date, now: Date = Date()) -> String {
        let f = RelativeDateTimeFormatter(); f.locale = locale; f.dateTimeStyle = .named
        guard let step = relativeStep(seconds: Int(date.timeIntervalSince(now)), then: date, now: now) else {
            return f.localizedString(fromTimeInterval: 0)
        }
        let unit: Calendar.Component = switch step.unit {
        case .minute: .minute
        case .hour: .hour
        case .day: .day
        case .week: .weekOfYear
        case .month: .month
        case .year: .year
        }
        var components = DateComponents(); components.setValue(step.count, for: unit)
        return f.localizedString(from: components)
    }
}

/// Prices in the reader's currency, as pricing.ts: the country wins over the language, else US dollars.
@MainActor
public enum DS1Pricing {
    static let byLanguage = ["da": "DKK", "de": "EUR", "es": "EUR", "fi": "EUR", "fr": "EUR", "it": "EUR", "pt": "EUR", "en": "USD", "is": "ISK", "ja": "JPY", "ko": "KRW", "nb": "NOK", "nn": "NOK", "no": "NOK", "pt-BR": "BRL", "sv": "SEK", "zh": "CNY"]
    static let byCountry = ["US": "USD", "GB": "GBP", "UK": "GBP", "JP": "JPY", "CN": "CNY", "KR": "KRW"]
    static let labels = ["DKK": "kr.", "NOK": "kr.", "SEK": "kr.", "ISK": "kr.", "EUR": "€", "USD": "$", "GBP": "£", "JPY": "¥", "CNY": "¥", "KRW": "₩", "BRL": "R$"]

    public static func currency(language: DS1Language? = nil, country: String? = nil) -> String {
        if let country, let c = byCountry[country.uppercased()] { return c }
        return byLanguage[(language ?? DS1Words.shared.language).code] ?? "USD"
    }
    public static func label(_ currency: String) -> String { labels[currency] ?? currency }
    public static func price(_ amount: Double, currency: String? = nil, minor: Bool = false) -> String {
        DS1Format.money(amount, currency: currency ?? self.currency(), minor: minor, whole: true)
    }
}

/// Copies text, as `copyText()`: the pasteboard, then "Copied" as a toast.
@MainActor
public enum DS1Clipboard {
    @discardableResult
    public static func copy(_ text: String, toast: Bool = true) -> Bool {
        #if canImport(UIKit)
        UIPasteboard.general.string = text
        let ok = UIPasteboard.general.string == text
        #else
        NSPasteboard.general.clearContents()
        let ok = NSPasteboard.general.setString(text, forType: .string)
        #endif
        if toast { if ok { DS1Toast.success(DS1Words.shared.text("Copied")) } else { DS1Toast.error(DS1Words.shared.text("Could not copy")) } }
        return ok
    }
}
