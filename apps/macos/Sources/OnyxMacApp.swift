import SwiftUI
import AppKit

@main
struct OnyxMacApp: App {
    @NSApplicationDelegateAdaptor(OnyxAppDelegate.self) var delegate

    var body: some Scene {
        Settings {
            OnyxSettingsView()
        }
    }
}

class OnyxAppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem?
    var popover: NSPopover?
    private let nervePort = ProcessInfo.processInfo.environment["NERVE_PORT"] ?? "3001"
    private var gatewayProcess: Process?

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupMenuBar()
        startGateway()
    }

    func applicationWillTerminate(_ notification: Notification) {
        stopGateway()
    }

    private func setupMenuBar() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        if let button = statusItem?.button {
            button.image = NSImage(systemSymbolName: "sparkles", accessibilityDescription: "ONYX")
            button.action = #selector(togglePopover)
            button.target = self
        }
        popover = NSPopover()
        popover?.contentViewController = NSHostingController(rootView: OnyxMenuView())
        popover?.behavior = .transient
    }

    @objc private func togglePopover() {
        guard let button = statusItem?.button else { return }
        if popover?.isShown == true {
            popover?.performClose(nil)
        } else {
            popover?.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
        }
    }

    private func startGateway() {
        // Launch @onyx/gateway via node/bun subprocess
        // In production would spawn gateway process
    }

    private func stopGateway() {
        gatewayProcess?.terminate()
    }
}