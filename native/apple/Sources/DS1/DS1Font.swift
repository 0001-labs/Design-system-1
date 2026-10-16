import CoreText
import Foundation
import SwiftUI

/// Design system 1's typefaces. The package carries the same woff2 files the web loads
/// (Core Text reads them) and registers them for the app the first time a face is asked
/// for. GT America sets text, with circular dots (`ss05`, as `--ds-font-features`);
/// arrows are Inter in every face; code is Iosevka Extended; figures may be Olivetti Dot.
/// Type stays on the grid: it does not follow the system text size.
public enum DS1Font {
    public enum Face: String, CaseIterable, Sendable {
        case regular = "GTAmerica-Regular"
        case medium = "GTAmerica-Medium"
        case compressed = "GTAmerica-CompressedRegular"
        case mono = "Iosevka-Extended"
        /// Inter's arrows alone ("Inter Arrows" on the web).
        case arrows = "Inter-Regular"
        /// Olivetti Dot, the dot-matrix face for figures.
        case figures = "OlivettiDot-Regular"
    }

    /// The PostScript names of the faces the package registered: the ones its product copied.
    public static let registered: Set<String> = {
        guard let folder = Bundle.module.url(forResource: "Fonts", withExtension: nil),
              let files = try? FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil)
        else { return [] }
        var names = Set<String>()
        for file in files where file.pathExtension == "woff2" || file.pathExtension == "ttf" || file.pathExtension == "otf" {
            guard let data = try? Data(contentsOf: file) as CFData,
                  let descriptors = CTFontManagerCreateFontDescriptorsFromData(data) as? [CTFontDescriptor]
            else { continue }
            // Registering again (a second bundle, a test host) is not a failure.
            CTFontManagerRegisterFontsForURL(file as CFURL, .process, nil)
            for d in descriptors {
                if let name = CTFontDescriptorCopyAttribute(d, kCTFontNameAttribute) as? String { names.insert(name) }
            }
        }
        return names
    }()

    /// Whether the product carries this face; without it text falls back to the system face.
    public static func isAvailable(_ face: Face) -> Bool { registered.contains(face.rawValue) }

    /// The face at `size` points, with Design system 1's features.
    public static func ctFont(_ face: Face, size: CGFloat) -> CTFont {
        guard isAvailable(face) else {
            #if canImport(UIKit)
            let system = face == .mono ? UIFont.monospacedSystemFont(ofSize: size, weight: .regular) : UIFont.systemFont(ofSize: size, weight: face == .medium ? .medium : .regular)
            #else
            let system = face == .mono ? NSFont.monospacedSystemFont(ofSize: size, weight: .regular) : NSFont.systemFont(ofSize: size, weight: face == .medium ? .medium : .regular)
            #endif
            return system as CTFont
        }
        var attributes: [CFString: Any] = [kCTFontNameAttribute: face.rawValue]
        if face == .regular || face == .medium || face == .compressed {
            attributes[kCTFontFeatureSettingsAttribute] = [[kCTFontOpenTypeFeatureTag: "ss05", kCTFontOpenTypeFeatureValue: 1]]
        }
        return CTFontCreateWithFontDescriptor(CTFontDescriptorCreateWithAttributes(attributes as CFDictionary), size, nil)
    }

    public static func font(_ face: Face, size: CGFloat) -> Font { Font(ctFont(face, size: size)) }

    static func characters(of face: Face) -> CharacterSet {
        guard isAvailable(face) else { return CharacterSet() }
        return CTFontCopyCharacterSet(ctFont(face, size: 12)) as CharacterSet
    }

    /// The arrows Inter Arrows draws, set in Inter in every face.
    public static let arrowCharacters: CharacterSet = characters(of: .arrows)

    /// What Olivetti Dot sets when figures are asked for: digits, currency signs and the
    /// signs of a number (+ - − . , %), where the face draws them. Letters keep the text face.
    public static let figureCharacters: CharacterSet = {
        var signs = CharacterSet.decimalDigits
        signs.formUnion(CharacterSet(charactersIn: "+-\u{2212}.,%"))
        for scalar in (0x20 ... 0x20CF).compactMap(Unicode.Scalar.init) where scalar.properties.generalCategory == .currencySymbol {
            signs.insert(scalar)
        }
        return signs.intersection(characters(of: .figures))
    }()
}
