// swift-tools-version: 6.0
// Design system 1 for SwiftUI on iPhone, iPad and Mac. The generated files in
// Sources/DS1/Generated come from palette.ts, measures.ts, the component tokens and the
// icon library (scripts/write-native-tokens.ts); the resources are laid out from DS1/
// by the same script here, and by Sync 1's `swift` export in a product.
import PackageDescription

let package = Package(
    name: "DS1",
    platforms: [.iOS(.v18), .macOS(.v14)],
    products: [.library(name: "DS1", targets: ["DS1"])],
    targets: [
        .target(
            name: "DS1",
            resources: [.process("Resources/Icons.xcassets"), .copy("Resources/Fonts")]
        ),
        .testTarget(name: "DS1Tests", dependencies: ["DS1"]),
    ],
    swiftLanguageModes: [.v5]
)
