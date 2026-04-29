// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "onyx-swabble",
    platforms: [.macOS(.v15), .iOS(.v17)],
    products: [
        .library(name: "OnyxSwabble", targets: ["OnyxSwabbleCore"]),
        .library(name: "OnyxSwabbleKit", targets: ["OnyxSwabbleKit"]),
        .executable(name: "onyx-swabble", targets: ["OnyxSwabbleCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/Commander.git", exact: "0.2.1"),
        .package(url: "https://github.com/apple/swift-testing", from: "0.99.0"),
    ],
    targets: [
        .target(name: "OnyxSwabbleCore", path: "Sources/OnyxSwabbleCore"),
        .target(name: "OnyxSwabbleKit", path: "Sources/OnyxSwabbleKit"),
        .executableTarget(
            name: "OnyxSwabbleCLI",
            dependencies: [
                "OnyxSwabbleCore",
                "OnyxSwabbleKit",
                .product(name: "Commander", package: "Commander"),
            ],
            path: "Sources/onyx-swabble"
        ),
        .testTarget(
            name: "OnyxSwabbleKitTests",
            dependencies: ["OnyxSwabbleKit", .product(name: "Testing", package: "swift-testing")],
            path: "Tests/OnyxSwabbleKitTests"
        ),
        .testTarget(
            name: "OnyxSwabbleTests",
            dependencies: ["OnyxSwabbleCore", .product(name: "Testing", package: "swift-testing")],
            path: "Tests/OnyxSwabbleTests"
        ),
    ],
    swiftLanguageModes: [.v6]
)