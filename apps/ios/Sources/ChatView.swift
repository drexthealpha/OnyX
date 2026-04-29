import SwiftUI

struct ChatView: View {
    @EnvironmentObject var runtime: OnyxRuntime
    @State private var input: String = ""
    @State private var messages: [(role: String, content: String)] = []

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 8) {
                    ForEach(messages, id: \.content) { msg in
                        HStack {
                            if msg.role == "user" { Spacer() }
                            Text(msg.content)
                                .padding(12)
                                .background(msg.role == "user" ? Color(hex: "22d3ee") : Color(hex: "1a1a3e"))
                                .foregroundColor(msg.role == "user" ? Color(hex: "0d0d1f") : Color(hex: "ddddff"))
                                .cornerRadius(12)
                            if msg.role == "assistant" { Spacer() }
                        }
                    }
                }
                .padding()
            }

            HStack {
                TextField("Message ONYX…", text: $input)
                    .textFieldStyle(.plain)
                    .padding()
                    .background(Color(hex: "1a1a3e"))
                    .foregroundColor(Color(hex: "ddddff"))
                    .cornerRadius(8)

                Button(action: send) {
                    Text("↑")
                        .font(.title2)
                        .foregroundColor(Color(hex: "0d0d1f"))
                        .frame(width: 40, height: 40)
                        .background(Color(hex: "22d3ee"))
                        .cornerRadius(8)
                }
            }
            .padding()
            .background(Color(hex: "0d0d1f"))
        }
        .background(Color(hex: "0d0d1f"))
    }

    private func send() {
        guard !input.isEmpty else { return }
        messages.append((role: "user", content: input))
        input = ""
    }
}