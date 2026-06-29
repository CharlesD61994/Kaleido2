import Capacitor

class KaleidoBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginType(KaleidoPdfViewerPlugin.self)
    }
}
