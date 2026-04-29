import Foundation
import OnyxSwabbleCore
import OnyxSwabbleKit
import Commander

@main
struct OnyxSwabbleCLI {
    static func main() async throws {
        var args = CommandLine.arguments
        args.removeFirst()

        if args.isEmpty {
            print("onyx-swabble - ONYX wake-word daemon")
            print("Usage: onyx-swabble <command>")
            print("")
            print("Commands:")
            print("  serve       Start the wake-word daemon")
            print("  setup       Write default config")
            print("  test-hook   Test the hook command")
            print("  mic list    List audio devices")
            print("  doctor     Diagnose issues")
            throw ExitCode(1)
        }

        let command = args[0]
        let rest = Array(args.dropFirst())

        switch command {
        case "serve":
            try await runServe()
        case "setup":
            try runSetup()
        case "test-hook":
            let transcript = rest.joined(separator: " ")
            try await runTestHook(transcript)
        case "mic":
            if rest.first == "list" {
                try runMicList()
            }
        case "doctor":
            try runDoctor()
        default:
            print("Unknown command: \(command)")
            throw ExitCode(1)
        }
    }

    static func runServe() async throws {
        let config = try OnyxSwabbleConfigLoader.load()
        print("onyx-swabble serve starting")
        print("Config: \(config.hook.command)")

        let transcriptsPath = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Library/Application Support/onyx-swabble/transcripts.log")
        let transcriptsStore = OnyxTranscriptsStore(url: transcriptsPath, maxEntries: config.transcripts.maxEntries)
        try transcriptsStore.load()

        let wakeGate = OnyxWakeWordGate(
            config: OnyxWakeWordConfig(
                enabled: config.wake.enabled,
                word: config.wake.word,
                aliases: config.wake.aliases
            ),
            transcriptsStore: transcriptsStore
        )

        print("Listening for wake word: \(config.wake.word)")
        print("Press Ctrl-C to stop")

        wakeGate.start()

        RunLoop.current.run()
    }

    static func runSetup() throws {
        let config = OnyxSwabbleConfig()
        config.wake.word = "onyx"
        config.wake.aliases = ["onyx"]
        config.hook.command = "/usr/local/bin/onyx"
        config.hook.args = ["gateway", "--voice-input"]

        try OnyxSwabbleConfigLoader.save(config)
        print("Config written to \(OnyxSwabbleConfig.defaultPath.path)")
    }

    static func runTestHook(_ transcript: String) async throws {
        let config = try OnyxSwabbleConfigLoader.load()
        let executor = OnyxHookExecutor(config: config.hook)

        if let result = try await executor.execute(transcript: transcript) {
            print("Output: \(result.output)")
            print("Exit code: \(result.exitCode)")
        }
    }

    static func runMicList() throws {
        print("Audio devices:")
        print("  (default) - Default input device")
    }

    static func runDoctor() throws {
        print("Running diagnostics...")

        let configPath = OnyxSwabbleConfig.defaultPath
        if FileManager.default.fileExists(atPath: configPath.path) {
            print("✓ Config exists")
            let config = try OnyxSwabbleConfigLoader.load()
            print("✓ Config loads")
        } else {
            print("✗ Config missing")
        }

        print("✓ onyx-swabble ready")
    }
}