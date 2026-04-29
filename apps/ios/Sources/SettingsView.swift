import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var runtime: OnyxRuntime
    @State private var displayName: String = "iPhone"
    @State private var wakeWords: String = "onyx"

    var body: some View {
        Form {
            Section("Device") {
                TextField("Display Name", text: $displayName)
                TextField("Wake Words", text: $wakeWords)
            }

            Section("About") {
                Text("ONYX")
                    .foregroundColor(Color(hex: "22d3ee"))
                Text("Version 2026.4.26")
                    .foregroundColor(Color(hex: "a5b4fc"))
            }
        }
        .scrollContentBackground(.hidden)
        .background(Color(hex: "0d0d1f"))
    }
}