import Foundation

public final class OnyxSpeechPipeline: @unchecked Sendable {
    private var isRunning = false
    private var currentBuffer: [Float] = []

    public init() {}

    public func start() {
        isRunning = true
    }

    public func stop() {
        isRunning = false
        currentBuffer.removeAll()
    }

    public func process(_ samples: [Float]) -> [Float] {
        guard isRunning else { return [] }
        currentBuffer.append(contentsOf: samples)
        // Return converted samples for analysis
        return currentBuffer
    }

    public var isActive: Bool { isRunning }
}

public final class OnyxBufferConverter: @unchecked Sendable {
    private let targetSampleRate: Double
    private let targetChannels: Int

    public init(targetSampleRate: Double = 16000, targetChannels: Int = 1) {
        self.targetSampleRate = targetSampleRate
        self.targetChannels = targetChannels
    }

    public func convert(_ buffer: [Float], from sourceRate: Double) -> [Float] {
        if sourceRate == targetSampleRate {
            return buffer
        }
        // Simplified resampling
        let ratio = targetSampleRate / sourceRate
        let outputLength = Int(Double(buffer.count) * ratio)
        var output = [Float](repeating: 0, count: outputLength)
        for i in 0..<outputLength {
            let sourceIndex = Double(i) / ratio
            let lower = Int(sourceIndex)
            let upper = min(lower + 1, buffer.count - 1)
            let fraction = sourceIndex - Double(lower)
            output[i] = buffer[lower] * (1 - fraction) + buffer[upper] * fraction
        }
        return output
    }
}

public struct OnyxSpeechSegment: Codable, Sendable, Identifiable {
    public let id: UUID
    public let text: String
    public let confidence: Double
    public let startTime: TimeInterval
    public let endTime: TimeInterval
    public let isFinal: Bool

    public init(id: UUID = UUID(), text: String, confidence: Double, startTime: TimeInterval, endTime: TimeInterval, isFinal: Bool) {
        self.id = id
        self.text = text
        self.confidence = confidence
        self.startTime = startTime
        self.endTime = endTime
        self.isFinal = isFinal
    }
}