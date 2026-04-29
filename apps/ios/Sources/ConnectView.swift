import SwiftUI

struct ConnectView: View {
    @EnvironmentObject var runtime: OnyxRuntime
    @State private var host: String = "localhost"
    @State private var port: String = "3001"
    @State private var tls: Bool = false

    var body: some View {
        Form {
            Section("Connection") {
                TextField("Host", text: $host)
                TextField("Port", text: $port)
                Toggle("TLS", isOn: $tls)
            }

            Section {
                if runtime.isConnected {
                    Button("Disconnect") {
                        runtime.disconnect()
                    }
                    .foregroundColor(.red)
                } else {
                    Button("Connect") {
                        runtime.connect(
                            host: host,
                            port: Int(port) ?? 3001,
                            tls: tls
                        )
                    }
                    .foregroundColor(Color(hex: "22d3ee"))
                }
            }

            Section("Status") {
                Text(runtime.statusText)
                    .foregroundColor(Color(hex: "a5b4fc"))
            }
        }
        .scrollContentBackground(.hidden)
        .background(Color(hex: "0d0d1f"))
    }
}