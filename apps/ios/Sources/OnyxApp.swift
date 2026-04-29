import SwiftUI

@main
struct OnyxApp: App {
    @StateObject private var runtime = OnyxRuntime()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(runtime)
        }
    }
}