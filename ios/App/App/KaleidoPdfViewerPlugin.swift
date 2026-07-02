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
        CAPPluginMethod(name: "setBackProgress", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hide", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise)
    ]

    private var pdfView: PDFView?
    private var overlayWindow: UIWindow?
    private var overlayController: UIViewController?
    private var currentPdfId: String?
    private var edgePanRecognizer: UIScreenEdgePanGestureRecognizer?
    private var edgeBackTriggered = false
    private var viewerBaseFrame: CGRect = .zero
    private var pdfInteractionsFrozen = false
    private var frozenPdfContentOffset: CGPoint?
    private var frozenPdfScaleFactor: CGFloat?

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
            self.applyViewerFrame(frame)
            self.resetPdfBackTransform()
            let shouldRestoreBeforeShowing = state != nil
            view.isHidden = shouldRestoreBeforeShowing
            view.isUserInteractionEnabled = true
            view.layer.zPosition = 10000
            view.superview?.bringSubviewToFront(view)
            self.overlayWindow?.isHidden = false

            let isNewDocument = self.currentPdfId != pdfId || view.document == nil
            if isNewDocument {
                view.document = PDFDocument(data: pdfData)
                self.currentPdfId = pdfId
            }
            self.configureScaleBounds(for: view, preserveCurrentScale: !isNewDocument)

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
            self.applyViewerFrame(frame)
            if let pdfView = self.pdfView {
                pdfView.layer.zPosition = 10000
                pdfView.superview?.bringSubviewToFront(pdfView)
                self.configureScaleBounds(for: pdfView, preserveCurrentScale: true)
            }
            call.resolve()
        }
    }

    @objc func hide(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.pdfView?.isHidden = true
            self.resetPdfBackTransform()
            self.setPdfInteractionsFrozen(false)
            self.overlayWindow?.isHidden = true
            call.resolve()
        }
    }

    @objc func setBackProgress(_ call: CAPPluginCall) {
        let progress = CGFloat(call.getDouble("progress") ?? 0)
        let animated = call.getBool("animated") ?? false

        DispatchQueue.main.async {
            if progress > 0 {
                self.setPdfInteractionsFrozen(true)
            }
            if animated {
                self.animatePdfWindowBack(to: progress)
            } else {
                self.applyPdfWindowBackProgress(progress)
            }
            if progress <= 0 {
                self.unfreezePdfInteractions(after: animated ? 0.24 : 0)
            }
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
        passthroughView.backgroundColor = UIColor(red: 0.067, green: 0.067, blue: 0.067, alpha: 1)
        controller.view = passthroughView
        let edgePan = UIScreenEdgePanGestureRecognizer(target: self, action: #selector(handleNativeBackGesture(_:)))
        edgePan.edges = .left
        edgePan.cancelsTouchesInView = true
        passthroughView.addGestureRecognizer(edgePan)

        let window = UIWindow(windowScene: scene)
        window.frame = scene.coordinateSpace.bounds
        window.rootViewController = controller
        window.backgroundColor = UIColor(red: 0.067, green: 0.067, blue: 0.067, alpha: 1)
        window.isOpaque = true
        window.windowLevel = .normal + 2
        window.isHidden = false

        overlayController = controller
        overlayWindow = window
        edgePanRecognizer = edgePan
    }

    @objc private func handleNativeBackGesture(_ recognizer: UIScreenEdgePanGestureRecognizer) {
        let translation = recognizer.translation(in: recognizer.view)
        let velocity = recognizer.velocity(in: recognizer.view)
        let width = max(recognizer.view?.bounds.width ?? UIScreen.main.bounds.width, 1)
        let progress = edgeProgress(for: translation.x, width: width)

        switch recognizer.state {
        case .began:
            edgeBackTriggered = false
            resetPdfBackTransform()
            setPdfInteractionsFrozen(true)
            dispatchEdgeEvent("kaleido-native-edge-start")

        case .changed:
            guard !edgeBackTriggered else { return }
            applyPdfWindowBackProgress(progress)
            dispatchEdgeEvent("kaleido-native-edge-progress", progress: progress)

        case .ended, .cancelled, .failed:
            guard !edgeBackTriggered else { return }
            let shouldCompleteByDistance = translation.x >= width * 0.24
            let shouldCompleteByFlick = translation.x >= 18 && velocity.x >= 360
            if shouldCompleteByDistance || shouldCompleteByFlick {
                completeNativeBackGesture()
            } else {
                animatePdfWindowBack(to: 0)
                unfreezePdfInteractions(after: 0.24)
                dispatchEdgeEvent("kaleido-native-edge-cancel")
            }

        default:
            break
        }
    }

    private func completeNativeBackGesture() {
        guard !edgeBackTriggered else { return }
        edgeBackTriggered = true
        animatePdfWindowBack(to: 1)
        dispatchEdgeEvent("kaleido-native-edge-complete")
    }

    private func edgeProgress(for translationX: CGFloat, width: CGFloat) -> CGFloat {
        let rawProgress = max(0, min(1, translationX / width))
        let easedProgress: CGFloat
        if rawProgress < 0.16 {
            easedProgress = rawProgress * 0.7
        } else {
            easedProgress = 0.112 + (rawProgress - 0.16) * 0.9
        }
        return max(0, min(1, easedProgress))
    }

    private func resetPdfBackTransform() {
        pdfView?.transform = .identity
        pdfView?.alpha = 1
        if viewerBaseFrame.width > 1, viewerBaseFrame.height > 1 {
            overlayWindow?.frame = viewerBaseFrame
        }
    }

    private func setPdfInteractionsFrozen(_ frozen: Bool) {
        guard pdfInteractionsFrozen != frozen else { return }
        pdfInteractionsFrozen = frozen
        if frozen {
            frozenPdfScaleFactor = pdfView?.scaleFactor
            frozenPdfContentOffset = pdfView.flatMap({ findScrollView(in: $0) })?.contentOffset
        } else {
            frozenPdfScaleFactor = nil
            frozenPdfContentOffset = nil
        }
        pdfView?.isUserInteractionEnabled = !frozen
        if let scrollView = pdfView.flatMap({ findScrollView(in: $0) }) {
            scrollView.layer.removeAllAnimations()
            scrollView.isScrollEnabled = !frozen
            scrollView.panGestureRecognizer.isEnabled = !frozen
            scrollView.pinchGestureRecognizer?.isEnabled = !frozen
        }
    }

    private func unfreezePdfInteractions(after delay: TimeInterval) {
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            if self.overlayWindow?.isHidden == false {
                self.setPdfInteractionsFrozen(false)
            }
        }
    }

    private func applyPdfWindowBackProgress(_ progress: CGFloat) {
        guard viewerBaseFrame.width > 1, viewerBaseFrame.height > 1 else { return }
        restoreFrozenPdfState()
        let width = max(bridge?.viewController?.view.window?.bounds.width ?? UIScreen.main.bounds.width, 1)
        var frame = viewerBaseFrame
        frame.origin.x = viewerBaseFrame.origin.x + (width * max(0, min(1, progress)))
        overlayWindow?.frame = frame
    }

    private func restoreFrozenPdfState() {
        guard pdfInteractionsFrozen, let view = pdfView else { return }
        if let scale = frozenPdfScaleFactor, view.scaleFactor != scale {
            view.scaleFactor = max(scale, view.minScaleFactor)
        }
        if let offset = frozenPdfContentOffset,
           let scrollView = findScrollView(in: view),
           scrollView.contentOffset != offset {
            scrollView.setContentOffset(offset, animated: false)
        }
    }

    private func animatePdfWindowBack(to progress: CGFloat) {
        let timing = UICubicTimingParameters(
            controlPoint1: CGPoint(x: 0.22, y: 1),
            controlPoint2: CGPoint(x: 0.36, y: 1)
        )
        let animator = UIViewPropertyAnimator(duration: 0.24, timingParameters: timing)
        animator.addAnimations {
            self.applyPdfWindowBackProgress(progress)
        }
        animator.startAnimation()
    }

    private func dispatchEdgeEvent(_ name: String, progress: CGFloat? = nil) {
        let script: String
        if let progress = progress {
            script = "window.dispatchEvent(new CustomEvent('\(name)', { detail: { progress: \(Double(progress)) } }))"
        } else {
            script = "window.dispatchEvent(new CustomEvent('\(name)'))"
        }
        bridge?.webView?.evaluateJavaScript(script)
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

    private func applyViewerFrame(_ object: JSObject) {
        let targetFrame = pixelAlignedFrame(cgRect(from: object))
        guard targetFrame.width > 1, targetFrame.height > 1 else { return }

        viewerBaseFrame = targetFrame
        overlayWindow?.frame = targetFrame
        overlayController?.view.frame = CGRect(origin: .zero, size: targetFrame.size)
        pdfView?.frame = CGRect(origin: .zero, size: targetFrame.size)
        overlayController?.view.setNeedsLayout()
        overlayController?.view.layoutIfNeeded()
        pdfView?.setNeedsLayout()
        pdfView?.layoutIfNeeded()
    }

    private func pixelAlignedFrame(_ rect: CGRect) -> CGRect {
        let scale = UIScreen.main.scale
        let x = (rect.origin.x * scale).rounded(.toNearestOrAwayFromZero) / scale
        let y = (rect.origin.y * scale).rounded(.up) / scale
        let maxX = ((rect.origin.x + rect.width) * scale).rounded(.down) / scale
        let maxY = ((rect.origin.y + rect.height) * scale).rounded(.down) / scale
        return CGRect(x: x, y: y, width: max(1, maxX - x), height: max(1, maxY - y))
    }

    private func configureScaleBounds(for view: PDFView, preserveCurrentScale: Bool) {
        let currentScale = view.scaleFactor
        view.autoScales = true
        view.layoutIfNeeded()
        let fittedScale = max(view.scaleFactorForSizeToFit, 0.35)
        view.minScaleFactor = fittedScale
        view.maxScaleFactor = max(8.0, fittedScale)
        if preserveCurrentScale && currentScale >= fittedScale {
            view.scaleFactor = currentScale
        } else if view.scaleFactor < fittedScale {
            view.scaleFactor = fittedScale
        }
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
                self.configureScaleBounds(for: view, preserveCurrentScale: true)
                view.scaleFactor = max(CGFloat(scaleFactor), view.minScaleFactor)
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

        for subview in subviews.reversed() {
            guard !subview.isHidden, subview.alpha > 0.01, subview.isUserInteractionEnabled else {
                continue
            }
            let convertedPoint = subview.convert(point, from: self)
            if subview.point(inside: convertedPoint, with: event) {
                return subview.hitTest(convertedPoint, with: event)
            }
        }

        return nil
    }
}
