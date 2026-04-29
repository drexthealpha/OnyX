import SwiftUI

struct VoiceView: View {
    @EnvironmentObject var runtime: OnyxRuntime
    @State private var isListening: Bool = false

    var body: some View {
        VStack {
            Text("Voice")
                .font(.title)
                .foregroundColor(Color(hex: "22d3ee"))

            ZStack {
                Circle()
                    .fill(isListening ? Color(hex: "22d3ee") : Color(hex: "1a1a3e"))
                    .frame(width: 120, height: 120)

                Image(systemName: isListening ? "mic.fill" : "mic")
                    .font(.system(size: 48))
                    .foregroundColor(isListening ? Color(hex: "0d0d1f") : Color(hex: "ddddff"))
            }
            .onTapGesture {
                isListening.toggle()
            }

            Text(isListening ? "Listening…" : "Tap to speak")
                .foregroundColor(Color(hex: "a5b4fc"))
                .padding(.top)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "0d0d1f"))
    }
}