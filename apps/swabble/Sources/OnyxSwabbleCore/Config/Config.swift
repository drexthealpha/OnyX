import Foundation

public struct OnyxSwabbleConfig: Codable, Sendable {
    public struct Audio: Codable, Sendable {
        public var deviceName: String = ""
        public var deviceIndex: Int = -1
        public var sampleRate: Double = 16000
        public var channels: Int = 1
    }

    public struct Wake: Codable, Sendable {
        public var enabled: Bool = true
        public var word: String = "onyx"
        public var aliases: [String] = ["onyx"]
    }

    public struct Hook: Codable, Sendable {
        public var command: String = ""
        public var args: [String] = []
        public var prefix: String = "Voice ONYX from ${hostname}: "
        public var cooldownSeconds: Double = 1
        public var minCharacters: Int = 24
        public var timeoutSeconds: Double = 5
        public var env: [String: String] = [:]
    }

    public struct Logging: Codable, Sendable {
        public var level: String = "info"
        public var format: String = "text"
    }

    public struct Transcripts: Codable, Sendable {
        public var enabled: Bool = true
        public var maxEntries: Int = 50
    }

    public struct Speech: Codable, Sendable {
        public var localeIdentifier: String = Locale.current.identifier
        public var etiquetteReplacements: Bool = false
    }

    public var audio = Audio()
    public var wake = Wake()
    public var hook = Hook()
    public var logging = Logging()
    public var transcripts = Transcripts()
    public var speech = Speech()

    public static let defaultPath: URL = FileManager.default
        .homeDirectoryForCurrentUser
        .appendingPathComponent(".config/onyx-swabble/config.json")

    public init() {}
}

public enum OnyxSwabbleConfigError: Error, LocalizedError {
    case missingConfig
    case invalidConfig(String)

    public var errorDescription: String? {
        switch self {
        case .missingConfig:
            return "Config file not found at ~/.config/onyx-swabble/config.json"
        case .invalidConfig(let message):
            return "Invalid config: \(message)"
        }
    }
}

public enum OnyxSwabbleConfigLoader {
    public static func load(at path: URL? = nil) throws -> OnyxSwabbleConfig {
        let url = path ?? OnyxSwabbleConfig.defaultPath
        guard FileManager.default.fileExists(atPath: url.path) else {
            throw OnyxSwabbleConfigError.missingConfig
        }
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(OnyxSwabbleConfig.self, from: data)
    }

    public static func save(_ config: OnyxSwabbleConfig, at path: URL? = nil) throws {
        let url = path ?? OnyxSwabbleConfig.defaultPath
        let dir = url.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let data = try JSONEncoder().encode(config)
        try data.write(to: url)
    }
}