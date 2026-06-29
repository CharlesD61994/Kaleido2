import Capacitor

class KaleidoBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(KaleidoPdfViewerPlugin())
        print("[KALEIDO] native PDF plugin registered")
    }
}
