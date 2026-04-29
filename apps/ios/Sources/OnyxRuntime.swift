import Foundation
import Combine
import WebSocket

@MainActor
final class OnyxRuntime: ObservableObject {
    @Published var isConnected: Bool = false
    @Published var statusText: String = "Offline"
    @Published var serverName: String? = nil
    @Published var sessionKey: String = ""

    private let nervePort: Int
    private var webSocket: URLSessionWebSocketTask?
    private let session: URLSession

    init(nervePort: Int = 3001) {
        self.nervePort = Int(ProcessInfo.processInfo.environment["NERVE_PORT"] ?? "\(nervePort)") ?? nervePort
        self.session = URLSession.shared
    }

    func connect(host: String, port: Int, tls: Bool = false) {
        let scheme = tls ? "wss" : "ws"
        let url = URL(string: "\(scheme)://\(host):\(port)/ws?sessionKey=\(sessionKey)")!
        statusText = "Connecting to \(host):\(port)…"

        var request = URLRequest(url: url)
        request.timeoutInterval = 30

        webSocket = session.webSocketTask(with: request)
        webSocket?.resume()
        isConnected = true
        statusText = "Connected"
    }

    func disconnect() {
        webSocket?.cancel(with: .normalClosure, reason: nil)
        webSocket = nil
        isConnected = false
        statusText = "Offline"
    }

    func send(message: String) {
        let message = URLSessionWebSocketTask.Message.string(message)
        webSocket?.send(message) { error in
            if let error = error {
                print("WebSocket error: \(error)")
            }
        }
    }
}