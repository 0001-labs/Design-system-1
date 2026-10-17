import SwiftUI
import XCTest
@testable import DS1

@MainActor
final class DS1BehaviourTests: XCTestCase {
    func testWordsFallBackAsTheWebDoes() {
        let words = DS1Words.shared
        XCTAssertEqual(words.text("Save", language: .da), "Gem")
        // nn has no table of its own and reads nb's.
        XCTAssertEqual(words.text("Save", language: .nn), words.text("Save", language: .nb))
        XCTAssertEqual(words.text("Not a shared word", language: .da), "Not a shared word")
        XCTAssertEqual(DS1Words.fill("Hello {name}", ["name": "Ada"]), "Hello Ada")
        XCTAssertEqual(DS1Words.fill("Hello {{name}}", ["name": "Ada"]), "Hello Ada")
        words.register(["da": ["Save": "Gem nu"]])
        XCTAssertEqual(words.text("Save", language: .da), "Gem nu")
    }

    func testPaperIsTheSurfaceUntilAViewSetsAnother() {
        var environment = EnvironmentValues()
        XCTAssertEqual(environment.ds1Paper, DS1Color.paper)
        environment.ds1Paper = DS1Color.white
        XCTAssertEqual(environment.ds1Paper, DS1Color.white)
    }

    func testLanguagesNormalizeAsTheWebDoes() {
        XCTAssertEqual(DS1Words.normalize("da-DK"), .da)
        XCTAssertEqual(DS1Words.normalize("nb_NO"), .nb)
        XCTAssertEqual(DS1Words.normalize("pt-br"), .ptBR)
        XCTAssertEqual(DS1Words.normalize("no", allowed: [.en, .nb]), .nb)
        XCTAssertEqual(DS1Words.normalize("pt", allowed: [.ptBR]), .ptBR)
        XCTAssertNil(DS1Words.normalize("nl"))
        XCTAssertEqual(DS1Language.ptBR.code, "pt-BR")
        XCTAssertEqual(DS1Language.ja.nativeLabel, "日本語")
    }

    func testRelativeTimeTakesTheWebsSteps() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        let now = calendar.date(from: DateComponents(year: 2026, month: 10, day: 17, hour: 12))!
        func step(_ seconds: Int) -> (Int, DS1Format.Unit)? {
            DS1Format.relativeStep(seconds: seconds, then: now.addingTimeInterval(TimeInterval(seconds)), now: now, calendar: calendar).map { ($0.count, $0.unit) }
        }
        XCTAssertNil(step(-30))
        XCTAssertEqual(step(-300)?.0, -5); XCTAssertEqual(step(-300)?.1, .minute)
        XCTAssertEqual(step(-3 * 3600)?.1, .hour)
        XCTAssertEqual(step(-30 * 3600)?.0, -1); XCTAssertEqual(step(-30 * 3600)?.1, .day)
        XCTAssertEqual(step(-14 * 86400)?.0, -2); XCTAssertEqual(step(-14 * 86400)?.1, .week)
        XCTAssertEqual(step(-91 * 86400)?.0, -3); XCTAssertEqual(step(-91 * 86400)?.1, .month)
        XCTAssertEqual(step(-730 * 86400)?.0, -2); XCTAssertEqual(step(-730 * 86400)?.1, .year)
    }

    func testCurrencyFollowsCountryThenLanguage() {
        XCTAssertEqual(DS1Pricing.currency(language: .da), "DKK")
        XCTAssertEqual(DS1Pricing.currency(language: .de), "EUR")
        XCTAssertEqual(DS1Pricing.currency(language: .en, country: "GB"), "GBP")
        XCTAssertEqual(DS1Pricing.currency(language: .en), "USD")
        XCTAssertEqual(DS1Pricing.label("DKK"), "kr.")
    }

    func testThemeCyclesLightDarkSystem() {
        XCTAssertEqual(DS1ThemeMode.light.next, .dark)
        XCTAssertEqual(DS1ThemeMode.dark.next, .system)
        XCTAssertEqual(DS1ThemeMode.system.next, .light)
        XCTAssertNil(DS1ThemeMode.system.colorScheme)
    }

    func testToastsUpdateInPlaceByID() {
        let id = DS1Toast.loading("Saving")
        DS1Toast.success("Saved", id: id)
        XCTAssertEqual(DS1Toast.shared.items.filter { $0.id == id }.count, 1)
        XCTAssertEqual(DS1Toast.shared.items.first { $0.id == id }?.title, "Saved")
        DS1Toast.dismiss()
        XCTAssertTrue(DS1Toast.shared.items.isEmpty)
    }

    func testAvatarInkReadsOnItsFill() {
        XCTAssertEqual(DS1Avatar.ink(on: Color(red: 0.6, green: 1, blue: 0.45)), DS1Color.black)
        XCTAssertEqual(DS1Avatar.ink(on: Color(red: 0.12, green: 0.12, blue: 0.12)), DS1Color.white)
    }
}
