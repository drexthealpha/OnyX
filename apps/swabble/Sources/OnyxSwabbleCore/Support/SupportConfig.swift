import Foundation

public struct OnyxSupportConfig {
    public static let appSupportDir: URL = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent("Library/Application Support/onyx-swabble")

    public static let transcriptsLog: URL = appSupportDir.appendingPathComponent("transcripts.log")

    public static func ensureAppSupportDir() throws {
        try FileManager.default.createDirectory(at: appSupportDir, withIntermediateDirectories: true)
    }
}