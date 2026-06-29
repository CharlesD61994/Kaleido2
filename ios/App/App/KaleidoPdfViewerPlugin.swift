import Capacitor
import PDFKit
import UIKit

@objc(KaleidoPdfViewerPlugin)
public class KaleidoPdfViewerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KaleidoPdfViewer"
    public let jsName = "KaleidoPdfViewer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateFrame", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hide", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise)
    ]

    private var pdfView: PDFView?
    private var overlayWindow: UIWindow?
    private var overlayController: UIViewController?
    private var currentPdfId: String?
    private var edgePanRecognizer: UIScreenEdgePanGestureRecognizer?
    private var edgeBackTriggered = false

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve([
            "available": true,
            "viewer": "PDFKit"
        ])
    }

    @objc func show(_ call: CAPPluginCall) {
        guard let pdfId = call.getString("pdfId"), !pdfId.isEmpty else {
            call.reject("PDF manquant.")
            return
        }

        guard let frame = call.getObject("frame") else {
            call.reject("Zone PDF manquante.")
            return
        }

        guard let dataString = call.getString("data"),
              let pdfData = decodePdfData(dataString) else {
            call.reject("PDF illisible.")
            return
        }

        let state = call.getObject("state")

        DispatchQueue.main.async {
            let view = self.ensurePdfView()
            view.frame = self.cgRect(from: frame)
            let shouldRestoreBeforeShowing = state != nil
            view.isHidden = shouldRestoreBeforeShowing
            view.isUserInteractionEnabled = true
            view.layer.zPosition = 10000
            view.superview?.bringSubviewToFront(view)
            self.overlayWindow?.isHidden = false

            if self.currentPdfId != pdfId || view.document == nil {
                view.document = PDFDocument(data: pdfData)
                self.currentPdfId = pdfId
                view.autoScales = true
                view.minScaleFactor = 0.35
                view.maxScaleFactor = 8.0
            }

            print("[KALEIDO] native PDF show id=\(pdfId) frame=\(view.frame) scale=\(view.scaleFactor)")
            self.restoreState(state, in: view) {
                view.isHidden = false
                call.resolve()
            }
        }
    }

    @objc func updateFrame(_ call: CAPPluginCall) {
        guard let frame = call.getObject("frame") else {
            call.reject("Zone PDF manquante.")
            return
        }

        DispatchQueue.main.async {
            self.pdfView?.frame = self.cgRect(from: frame)
            if let pdfView = self.pdfView {
                pdfView.layer.zPosition = 10000
                pdfView.superview?.bringSubviewToFront(pdfView)
            }
            call.resolve()
        }
    }

    @objc func hide(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.pdfView?.isHidden = true
            self.overlayWindow?.isHidden = true
            call.resolve()
        }
    }

    @objc func getState(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            call.resolve(self.currentState())
        }
    }

    private func ensurePdfView() -> PDFView {
        if let pdfView = pdfView {
            return pdfView
        }

        ensureOverlayWindow()

        let view = PDFView(frame: .zero)
        view.backgroundColor = UIColor(red: 0.067, green: 0.067, blue: 0.067, alpha: 1)
        view.displayMode = .singlePageContinuous
        view.displayDirection = .vertical
        view.usePageViewController(false)
        view.autoScales = true
        view.displaysPageBreaks = true
        view.isUserInteractionEnabled = true
        view.layer.zPosition = 10000

        overlayController?.view.addSubview(view)
        overlayController?.view.bringSubviewToFront(view)
        pdfView = view
        return view
    }

    private func ensureOverlayWindow() {
        if overlayWindow != nil {
            return
        }

        guard let scene = bridge?.viewController?.view.window?.windowScene
            ?? UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first else {
            return
        }

        let controller = UIViewController()
        let passthroughView = KaleidoPdfOverlayView(frame: UIScreen.main.bounds)
        passthroughView.backgroundColor = .clear
        controller.view = passthroughView
        let edgePan = UIScreenEdgePanGestureRecognizer(target: self, action: #selector(handleNativeBackGesture(_:)))
        edgePan.edges = .left
        edgePan.cancelsTouchesInView = false
        passthroughView.addGestureRecognizer(edgePan)

        let window = UIWindow(windowScene: scene)
        window.frame = scene.coordinateSpace.bounds
        window.rootViewController = controller
        window.backgroundColor = .clear
        window.windowLevel = .normal + 2
        window.isHidden = false

        overlayController = controller
        overlayWindow = window
        edgePanRecognizer = edgePan
    }

    @objc private func handleNativeBackGesture(_ recognizer: UIScreenEdgePanGestureRecognizer) {
        if recognizer.state == .began {
            edgeBackTriggered = false
            return
        }

        let translation = recognizer.translation(in: recognizer.view)
        let velocity = recognizer.velocity(in: recognizer.view)
        let shouldNavigateBack = translation.x > 44 || velocity.x > 360
        guard !edgeBackTriggered && shouldNavigateBack else {
            return
        }

        edgeBackTriggered = true
        bridge?.webView?.evaluateJavaScript(
            "window.dispatchEvent(new CustomEvent('kaleido-native-edge-back'))"
        )
    }

    private func decodePdfData(_ value: String) -> Data? {
        let base64 = value.components(separatedBy: ",").last ?? value
        return Data(base64Encoded: base64, options: [.ignoreUnknownCharacters])
    }

    private func cgRect(from object: JSObject) -> CGRect {
        let x = CGFloat(doubleValue(object["x"]))
        let y = CGFloat(doubleValue(object["y"]))
        let width = CGFloat(doubleValue(object["width"]))
        let height = CGFloat(doubleValue(object["height"]))
        return CGRect(x: x, y: y, width: width, height: height)
    }

    private func doubleValue(_ value: Any?) -> Double {
        if let double = value as? Double { return double }
        if let int = value as? Int { return Double(int) }
        if let number = value as? NSNumber { return number.doubleValue }
        return 0
    }

    private func intValue(_ value: Any?) -> Int {
        if let int = value as? Int { return int }
        if let double = value as? Double { return Int(double) }
        if let number = value as? NSNumber { return number.intValue }
        return 0
    }

    private func currentState() -> JSObject {
        guard let view = pdfView else {
            return [:]
        }

        let pageIndex: Int
        if let page = view.currentPage, let document = view.document {
            pageIndex = document.index(for: page)
        } else {
            pageIndex = 0
        }

        let scrollView = findScrollView(in: view)
        return [
            "pageIndex": pageIndex,
            "scaleFactor": Double(view.scaleFactor),
            "offsetX": Double(scrollView?.contentOffset.x ?? 0),
            "offsetY": Double(scrollView?.contentOffset.y ?? 0)
        ]
    }

    private func restoreState(_ state: JSObject?, in view: PDFView, completion: @escaping () -> Void) {
        guard let state = state else {
            completion()
            return
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
            let pageIndex = self.intValue(state["pageIndex"])
            if let page = view.document?.page(at: max(0, pageIndex)) {
                view.go(to: page)
            }

            let scaleFactor = self.doubleValue(state["scaleFactor"])
            if scaleFactor > 0 {
                view.scaleFactor = CGFloat(scaleFactor)
            }

            if let scrollView = self.findScrollView(in: view) {
                let x = CGFloat(self.doubleValue(state["offsetX"]))
                let y = CGFloat(self.doubleValue(state["offsetY"]))
                let maxX = max(0, scrollView.contentSize.width - scrollView.bounds.width)
                let maxY = max(0, scrollView.contentSize.height - scrollView.bounds.height)
                scrollView.setContentOffset(
                    CGPoint(x: min(max(0, x), maxX), y: min(max(0, y), maxY)),
                    animated: false
                )
            }

            completion()
        }
    }

    private func findScrollView(in view: UIView) -> UIScrollView? {
        if let scrollView = view as? UIScrollView {
            return scrollView
        }

        for subview in view.subviews {
            if let scrollView = findScrollView(in: subview) {
                return scrollView
            }
        }

        return nil
    }
}

final class KaleidoPdfOverlayView: UIView {
    private let edgeBackPassthroughWidth: CGFloat = 32

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        if point.x <= edgeBackPassthroughWidth {
            return self
        }

        let hit = super.hitTest(point, with: event)
        return hit === self ? nil : hit
    }
}
