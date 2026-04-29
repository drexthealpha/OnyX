import Foundation

public final class OnyxHookExecutor: @unchecked Sendable {
    private let config: OnyxSwabbleConfig.Hook
    private var lastExecution: Date?
    private let cooldown: TimeInterval

    public init(config: OnyxSwabbleConfig.Hook) {
        self.config = config
        self.cooldown = config.cooldownSeconds
    }

    public func canExecute() -> Bool {
        guard let last = lastExecution else { return true }
        return Date().timeIntervalSince(last) >= cooldown
    }

    public func execute(transcript: String) async throws -> (output: String, exitCode: Int32)? {
        guard canExecute() else { return nil }
        guard transcript.count >= config.minCharacters else { return nil }

        lastExecution = Date()
        var env = ProcessInfo.processInfo.environment
        for (key, value) in config.env {
            env[key] = value
        }

        var arguments = config.args
        arguments.append(transcript)

        let process = Process()
        process.executableURL = URL(fileURLWithPath: config.command)
        process.arguments = arguments
        process.environment = env

        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe

        try process.run()
        process.waitUntilExit()

        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let output = String(data: data, encoding: .utf8) ?? ""
        return (output, process.terminationStatus)
    }
}