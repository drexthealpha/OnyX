import Foundation

public struct OnyxWakeWordConfig: Codable, Sendable {
    public var enabled: Bool = true
    public var word: String = "onyx"
    public var aliases: [String] = ["onyx"]
    public var sensitivity: Double = 0.5
    public var minConfidence: Double = 0.7

    public init() {}
}

public struct OnyxWakeWordSegment: Codable, Sendable, Identifiable {
    public let id: UUID
    public let word: String
    public let transcript: String
    public let confidence: Double
    public let startTime: TimeInterval
    public let endTime: TimeInterval

    public init(id: UUID = UUID(), word: String, transcript: String, confidence: Double, startTime: TimeInterval, endTime: TimeInterval) {
        self.id = id
        self.word = word
        self.transcript = transcript
        self.confidence = confidence
        self.startTime = startTime
        self.endTime = endTime
    }
}

public struct OnyxWakeWordGateMatch: Codable, Sendable {
    public let word: String
    public let transcript: String
    public let confidence: Double
    public let timestamp: Date

    public init(word: String, transcript: String, confidence: Double, timestamp: Date = Date()) {
        self.word = word
        self.transcript = transcript
        self.confidence = confidence
        self.timestamp = timestamp
    }
}

public final class OnyxWakeWordGate: @unchecked Sendable {
    private let config: OnyxWakeWordConfig
    private let transcriptsStore: OnyxTranscriptsStore
    private var isListening = false

    public init(config: OnyxWakeWordConfig, transcriptsStore: OnyxTranscriptsStore) {
        self.config = config
        self.transcriptsStore = transcriptsStore
    }

    public func start() {
        isListening = true
    }

    public func stop() {
        isListening = false
    }

    public func processAudioBuffer(_ buffer: [Float], sampleRate: Double) -> OnyxWakeWordGateMatch? {
        guard isListening else { return nil }
        // Simplified wake word detection - in production would use Speech framework
        return nil
    }

    public func handleMatch(_ match: OnyxWakeWordGateMatch) {
        transcriptsStore.append(transcript: match.transcript)
    }
}

public enum OnyxTranscriptsStoreError: Error, LocalizedError {
    case writeFailed(String)
    case readFailed(String)

    public var errorDescription: String? {
        switch self {
        case .writeFailed(let message): return "Write failed: \(message)"
        case .readFailed(let message): return "Read failed: \(message)"
        }
    }
}

public final class OnyxTranscriptsStore: @unchecked Sendable {
    private let url: URL
    private let maxEntries: Int
    private let queue = DispatchQueue(label: "onyx.transcripts.store")
    private var entries: [String] = []

    public init(url: URL, maxEntries: Int = 50) {
        self.url = url
        self.maxEntries = maxEntries
    }

    public func load() throws {
        guard FileManager.default.fileExists(atPath: url.path) else {
            entries = []
            return
        }
        let data = try Data(contentsOf: url)
        entries = (try? JSONDecoder().decode([String].self, from: data)) ?? []
    }

    public func append(transcript: String) {
        queue.sync {
            entries.append("\(Date().timeIntervalSince1970): \(transcript)")
            if entries.count > maxEntries {
                entries.removeFirst(entries.count - maxEntries)
            }
            save()
        }
    }

    public func getAll() -> [String] {
        queue.sync { entries }
    }

    private func save() {
        do {
            let data = try JSONEncoder().encode(entries)
            try data.write(to: url)
        } catch {
            // Log error
        }
    }
}