import SwiftUI

struct OnyxMenuView: View {
    @State private var isRunning: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("ONYX")
                    .font(.headline)
                    .foregroundColor(Color(hex: "22d3ee"))
                Spacer()
                if isRunning {
                    Circle()
                        .fill(Color(hex: "4ade80"))
                        .frame(width: 8, height: 8)
                }
            }

            Text("Sovereign AI OS")
                .font(.caption)
                .foregroundColor(.secondary)

            Divider()

            Button("Open Dashboard") {
                NSWorkspace.shared.open(URL(string: "http://localhost:3001")!)
            }

            Button("Settings…") {
                NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil)
            }

            Divider()

            Button("Quit ONYX") {
                NSApp.terminate(nil)
            }
        }
        .padding()
        .frame(width: 220)
    }
}