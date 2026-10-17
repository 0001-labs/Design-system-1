import CoreText
import SwiftUI
import XCTest
@testable import DS1

final class DS1Tests: XCTestCase {
    func testPaletteFollowsItsSource() {
        // palette.ts derives Apple green's dark version as the Figma file does.
        XCTAssertEqual(DS1Color.appleGreen.light, 0x99ff73)
        XCTAssertEqual(DS1Color.appleGreen.dark, 0x529d36)
        XCTAssertEqual(DS1Color.zenithBlue.light, 0xccccff)
        XCTAssertEqual(DS1Color.accent, DS1Color(0x99ff73))
        XCTAssertEqual(DS1Color.palette.count, 28)
    }

    func testScaleMatchesScalingTs() {
        XCTAssertEqual(DS1Scale.device(width: 280).factor, 1)
        XCTAssertEqual(DS1Scale.device(width: 393).factor, 1.404)
        XCTAssertEqual(DS1Scale.device(width: 402).factor, 1.436)
        XCTAssertEqual(DS1Scale.device(width: 200).factor, 0.75)
        XCTAssertEqual(DS1Scale.device(width: 1024).factor, 2)
        // Snapped to the screen's pixels, a square is a whole number of them (scaling.ts's "pixel").
        XCTAssertEqual(DS1Scale.device(width: 393, pixels: 3).unit * 3, 84)
        XCTAssertEqual(DS1Scale.device(width: 402, pixels: 3).unit * 3, 86)
        XCTAssertEqual(DS1Scale.device(width: 440, pixels: 3).unit * 3, 94)
        XCTAssertEqual(DS1Scale.device(width: 1024, pixels: 2).factor, 2)
        let scale = DS1Scale.device(width: 393)
        XCTAssertEqual(scale.unit, 20 * 1.404, accuracy: 0.0001)
        XCTAssertEqual(scale.line, 1)
        XCTAssertEqual(scale.wholeSquares(in: 393 - 2 * scale.unit), 11 * scale.unit, accuracy: 0.0001)
    }

    /// Without a face, text silently falls back to the system font, so load each one.
    func testEveryCopiedFaceLoads() {
        for face in DS1Font.Face.allCases {
            XCTAssertTrue(DS1Font.isAvailable(face), "\(face.rawValue) did not register")
            XCTAssertEqual(CTFontCopyPostScriptName(DS1Font.ctFont(face, size: 14)) as String, face.rawValue)
        }
    }

    func testFiguresAreDigitsAndTheSignsOfNumbers() {
        for character in "0123456789$€¥£₩−-+.,%".unicodeScalars { XCTAssertTrue(DS1Font.figureCharacters.contains(character), "\(character)") }
        for character in "aZ ()".unicodeScalars { XCTAssertFalse(DS1Font.figureCharacters.contains(character), "\(character)") }
        XCTAssertTrue(DS1Font.arrowCharacters.contains("→"))
    }

    func testDigitsStandInCellsOfOneWidth() {
        let font = DS1Font.ctFont(.figures, size: 14)
        let cell = DS1Font.advance(of: "0", in: font)
        XCTAssertEqual(cell, 14 * 0.77, accuracy: 0.01)
        // Figures are set at GT America's cap height (`figureScale`), so a 1 is centred in the
        // cell of a 0 at that size, not at the text's 14.
        let figures = DS1Font.ctFont(.figures, size: 14 * DS1Font.figureScale)
        let text = DS1Font.attributed("1", scale: .desktop, figures: true)
        let one = DS1Font.advance(of: "1", in: figures)
        XCTAssertEqual(text.runs.first?.kern ?? 0, (DS1Font.advance(of: "0", in: figures) - one) / 2, accuracy: 0.01)
    }

    func testEveryIconIsInTheCatalogue() {
        #if canImport(UIKit)
        for name in DS1IconName.allCases { XCTAssertNotNil(UIImage(named: name.rawValue, in: .module, with: nil), name.rawValue) }
        #else
        let missing = DS1IconName.allCases.filter { Bundle.module.image(forResource: $0.rawValue) == nil }
        XCTAssertEqual(missing, [])
        #endif
    }
}
