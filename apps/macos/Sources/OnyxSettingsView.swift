import SwiftUI

struct OnyxSettingsView: View {
    @AppStorage("displayName") private var displayName: String = "Mac"
    @AppStorage("nervePort") private var nervePort: String = "3001"
    @AppStorage("autoStart") private var autoStart: Bool = true

    var body: some View {
        Form {
            Section("Device") {
                TextField("Display Name", text: $displayName)
            }

            Section("Gateway") {
                TextField("NERVE_PORT", text: $nervePort)
                Toggle("Auto-start gateway", isOn: $autoStart)
            }

            Section("About") {
                LabeledContent("Version", value: "2026.4.26")
                LabeledContent("Bundle ID", value: "ai.onyx.macos")
            }
        }
        .formStyle(.grouped)
        .frame(width: 400, height: 300)
    }
}