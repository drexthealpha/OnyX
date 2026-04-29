import SwiftUI
import WebKit

struct CanvasView: View {
    @EnvironmentObject var runtime: OnyxRuntime

    var body: some View {
        VStack {
            Text("Canvas Screen")
                .font(.title)
                .foregroundColor(Color(hex: "22d3ee"))

            Text("Status: \(runtime.statusText)")
                .foregroundColor(Color(hex: "a5b4fc"))

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "0d0d1f"))
    }
}

struct CanvasRepresentable: UIViewRepresentable {
    let url: URL?

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        return WKWebView(frame: .zero, configuration: config)
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if let url = url {
            webView.load(URLRequest(url: url))
        }
    }
}