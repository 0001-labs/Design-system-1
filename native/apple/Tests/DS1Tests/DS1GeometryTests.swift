import CoreText
import SwiftUI
import XCTest
@testable import DS1

/// Where words and marks land on the grid, read from the pixels of a rendered view, against
/// where the web's CSS puts them.
@MainActor
final class DS1GeometryTests: XCTestCase {
    /// The rows of a view's rendering, at `scale` pixels per point, that hold ink.
    private func inkRows<V: View>(_ view: V, width: CGFloat, height: CGFloat, scale: CGFloat = 4) -> (first: CGFloat, last: CGFloat)? {
        let renderer = ImageRenderer(content: view.frame(width: width, height: height, alignment: .topLeading).background(Color.white).environment(\.colorScheme, .light))
        renderer.scale = scale
        guard let image = renderer.cgImage, let data = image.dataProvider?.data, let bytes = CFDataGetBytePtr(data) else { return nil }
        let perRow = image.bytesPerRow, perPixel = image.bitsPerPixel / 8
        var first: Int?, last: Int?
        for y in 0..<image.height {
            for x in 0..<image.width {
                let offset = y * perRow + x * perPixel
                if Int(bytes[offset]) + Int(bytes[offset + 1]) + Int(bytes[offset + 2]) < 3 * 128 {
                    if first == nil { first = y }
                    last = y
                    break
                }
            }
        }
        guard let first, let last else { return nil }
        return (CGFloat(first) / scale, CGFloat(last + 1) / scale)
    }

    private var metrics: (ascent: CGFloat, descent: CGFloat, cap: CGFloat) {
        let font = DS1Font.ctFont(.regular, size: 14)
        return (CTFontGetAscent(font), CTFontGetDescent(font), CTFontGetCapHeight(font))
    }

    func testALineStandsOnTheSixteen() throws {
        // A 14px line in a 16px line box at the foot of its square: capitals centred in the sixteen.
        let ink = try XCTUnwrap(inkRows(DS1LineText("HHH").environment(\.ds1Scale, .desktop), width: 100, height: 20))
        let baseline = 4 + (16 + metrics.cap) / 2
        XCTAssertEqual(ink.last, baseline, accuracy: 0.5)
        XCTAssertEqual(ink.first, baseline - metrics.cap, accuracy: 0.5)
    }

    func testWrappedLinesStandWhereTheWebsTwentyPixelLinesPutThem() throws {
        // Prose on 20px lines: the face's ascent and descent centred in each line, as CSS does.
        let m = metrics
        let baseline = (20 - (m.ascent + m.descent)) / 2 + m.ascent
        let one = try XCTUnwrap(inkRows(DS1LineText("HHH", wrap: true).environment(\.ds1Scale, .desktop), width: 100, height: 60))
        XCTAssertEqual(one.last, baseline, accuracy: 0.5)
        XCTAssertEqual(one.first, baseline - m.cap, accuracy: 0.5)
        let two = try XCTUnwrap(inkRows(DS1LineText("HHH HHH", wrap: true).environment(\.ds1Scale, .desktop), width: 40, height: 60))
        XCTAssertEqual(two.last, baseline + 20, accuracy: 0.5)
    }

    func testACentredEmptyStateCentresAOneLineHeading() throws {
        // Ink of a short heading over a longer line, centred: both midpoints on the block's middle.
        let view = DS1Empty(heading: "HH", text: "HHHHHHHH", centered: true).environment(\.ds1Scale, .desktop)
        let renderer = ImageRenderer(content: view.frame(width: 320).background(Color.white).environment(\.colorScheme, .light))
        renderer.scale = 2
        let image = try XCTUnwrap(renderer.cgImage)
        let data = try XCTUnwrap(image.dataProvider?.data), bytes = try XCTUnwrap(CFDataGetBytePtr(data))
        func midpoint(rows: Range<Int>) -> CGFloat? {
            var xs: [Int] = []
            for y in rows { for x in 0..<image.width {
                let o = y * image.bytesPerRow + x * image.bitsPerPixel / 8
                if Int(bytes[o]) + Int(bytes[o + 1]) + Int(bytes[o + 2]) < 3 * 160 { xs.append(x) }
            } }
            guard let lo = xs.min(), let hi = xs.max() else { return nil }
            return CGFloat(lo + hi) / 4
        }
        let heading = try XCTUnwrap(midpoint(rows: 0..<40)), text = try XCTUnwrap(midpoint(rows: 40..<80))
        XCTAssertEqual(heading, 160, accuracy: 1)
        XCTAssertEqual(text, 160, accuracy: 1)
    }

    func testAWrappedLineTakesItsSquares() {
        let size = NSHostingView(rootView: DS1LineText("HHH HHH HHH", wrap: true).frame(width: 40).environment(\.ds1Scale, .desktop)).fittingSize
        XCTAssertEqual(size.height, 60, accuracy: 0.01)
    }
}

