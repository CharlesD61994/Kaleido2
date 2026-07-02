import Capacitor
import CoreText
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
        CAPPluginMethod(name: "updateHeader", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setBackProgress", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hide", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise)
    ]

    private var pdfView: PDFView?
    private var overlayWindow: UIWindow?
    private var overlayController: UIViewController?
    private var headerView: KaleidoNativePdfHeaderView?
    private var currentPdfId: String?
    private var currentNativeBackground = UIColor(red: 0.067, green: 0.067, blue: 0.067, alpha: 1)
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
            self.updateHeaderView(call.getObject("header"))
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
            self.configureScrollViewInsets(for: view)

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
                self.configureScrollViewInsets(for: pdfView)
            }
            call.resolve()
        }
    }

    @objc func updateHeader(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.updateHeaderView(call.getObject("header"))
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
        view.displaysPageBreaks = false
        view.pageBreakMargins = .zero
        view.isUserInteractionEnabled = true
        view.layer.zPosition = 10000

        overlayController?.view.addSubview(view)
        overlayController?.view.bringSubviewToFront(view)
        if let headerView = headerView {
            overlayController?.view.bringSubviewToFront(headerView)
        }
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
        let targetPdfFrame = pixelAlignedFrame(cgRect(from: object))
        guard targetPdfFrame.width > 1, targetPdfFrame.height > 1 else { return }

        let sceneBounds = overlayWindow?.windowScene?.coordinateSpace.bounds
            ?? bridge?.viewController?.view.window?.bounds
            ?? UIScreen.main.bounds
        viewerBaseFrame = sceneBounds
        overlayWindow?.frame = sceneBounds
        overlayController?.view.frame = CGRect(origin: .zero, size: sceneBounds.size)
        headerView?.frame = CGRect(
            x: targetPdfFrame.origin.x,
            y: 0,
            width: targetPdfFrame.width,
            height: max(0, targetPdfFrame.origin.y)
        )
        let pdfTopGap: CGFloat = 4
        pdfView?.frame = CGRect(
            x: targetPdfFrame.origin.x,
            y: targetPdfFrame.origin.y + pdfTopGap,
            width: targetPdfFrame.width,
            height: max(1, targetPdfFrame.height - pdfTopGap)
        )
        overlayController?.view.setNeedsLayout()
        overlayController?.view.layoutIfNeeded()
        headerView?.setNeedsLayout()
        headerView?.layoutIfNeeded()
        pdfView?.setNeedsLayout()
        pdfView?.layoutIfNeeded()
        if let pdfView = pdfView {
            configureScrollViewInsets(for: pdfView)
        }
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

    private func configureScrollViewInsets(for view: PDFView) {
        guard let scrollView = findScrollView(in: view) else { return }
        scrollView.contentInset = .zero
        scrollView.scrollIndicatorInsets = .zero
        scrollView.contentInsetAdjustmentBehavior = .never
        scrollView.backgroundColor = view.backgroundColor
    }

    private func updateHeaderView(_ object: JSObject?) {
        ensureOverlayWindow()
        if headerView == nil {
            let view = KaleidoNativePdfHeaderView(frame: .zero)
            view.onAction = { [weak self] action in
                self?.dispatchPdfAction(action)
            }
            overlayController?.view.addSubview(view)
            headerView = view
        }

        headerView?.update(with: object)
        currentNativeBackground = headerView?.currentBackgroundColor ?? currentNativeBackground
        overlayWindow?.backgroundColor = currentNativeBackground
        overlayController?.view.backgroundColor = currentNativeBackground
        pdfView?.backgroundColor = currentNativeBackground
        if let pdfView = pdfView {
            configureScrollViewInsets(for: pdfView)
        }
        if let headerView = headerView {
            overlayController?.view.bringSubviewToFront(headerView)
        }
    }

    private func dispatchPdfAction(_ action: String) {
        let script = "window.dispatchEvent(new CustomEvent('kaleido-native-pdf-action', { detail: { action: '\(action)' } }))"
        bridge?.webView?.evaluateJavaScript(script)
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

private extension UIColor {
    static func kaleidoHex(_ value: String?) -> UIColor? {
        guard var hex = value?.trimmingCharacters(in: .whitespacesAndNewlines), !hex.isEmpty else {
            return nil
        }
        if hex.hasPrefix("#") {
            hex.removeFirst()
        }
        guard hex.count == 6, let rgb = Int(hex, radix: 16) else {
            return nil
        }
        return UIColor(
            red: CGFloat((rgb >> 16) & 0xff) / 255,
            green: CGFloat((rgb >> 8) & 0xff) / 255,
            blue: CGFloat(rgb & 0xff) / 255,
            alpha: 1
        )
    }
}

private enum KaleidoNativeFont {
    private static let variationAttribute = UIFontDescriptor.AttributeName(rawValue: kCTFontVariationAttribute as String)

    static func dmSans(size: CGFloat, weightValue: CGFloat = 700, fallbackWeight: UIFont.Weight = .bold) -> UIFont {
        variableFont(name: "DMSans-9ptRegular", size: size, weightValue: weightValue, fallbackWeight: fallbackWeight)
    }

    static func syne(size: CGFloat, weightValue: CGFloat = 700, fallbackWeight: UIFont.Weight = .bold) -> UIFont {
        variableFont(name: "Syne-Regular", size: size, weightValue: weightValue, fallbackWeight: fallbackWeight)
    }

    private static func variableFont(name: String, size: CGFloat, weightValue: CGFloat, fallbackWeight: UIFont.Weight) -> UIFont {
        guard UIFont(name: name, size: size) != nil else {
            return UIFont.systemFont(ofSize: size, weight: fallbackWeight)
        }

        let descriptor = UIFontDescriptor(fontAttributes: [
            .name: name,
            variationAttribute: [axis("wght"): weightValue],
        ])
        return UIFont(descriptor: descriptor, size: size)
    }

    private static func axis(_ tag: String) -> Int {
        tag.utf8.reduce(0) { ($0 << 8) + Int($1) }
    }
}

final class KaleidoNativePdfHeaderView: UIView {
    var onAction: ((String) -> Void)?
    var currentBackgroundColor: UIColor {
        background
    }

    private var background = UIColor(red: 0.035, green: 0.035, blue: 0.055, alpha: 1)
    private var textColor = UIColor.white
    private var trackColor = UIColor.white.withAlphaComponent(0.12)
    private var accent = UIColor(red: 0.486, green: 0.227, blue: 0.929, alpha: 1)
    private var accentLight = UIColor(red: 0.655, green: 0.545, blue: 0.98, alpha: 1)

    private let globalLabel = UILabel()
    private let circleView = KaleidoNativeCircleView()
    private let partButton = UIButton(type: .system)
    private let partCountLabel = UILabel()
    private let progressTrack = UIView()
    private let progressFill = UIView()
    private let minusButton = UIButton(type: .system)
    private let countLabel = UILabel()
    private let plusButton = UIButton(type: .system)
    private let timerButton = UIButton(type: .system)
    private let timerMenu = UIView()
    private let timerMenuLabel = UILabel()
    private let timerToggleButton = UIButton(type: .system)
    private let timerResetButton = UIButton(type: .system)
    private let clientButton = UIButton(type: .system)
    private let unreadBadge = UILabel()

    private var localProgress: CGFloat = 0
    private var hasClient = false
    private var isTimerMenuOpen = false
    private var isTimerRunning = false

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        backgroundColor = background
        clipsToBounds = false

        globalLabel.text = "Global"
        globalLabel.font = KaleidoNativeFont.dmSans(size: 12.5, weightValue: 760, fallbackWeight: .bold)
        globalLabel.textAlignment = .center

        circleView.backgroundColor = .clear

        partButton.titleLabel?.font = KaleidoNativeFont.dmSans(size: 16, weightValue: 700, fallbackWeight: .bold)
        partButton.contentHorizontalAlignment = .left
        partButton.addTarget(self, action: #selector(openPartiePicker), for: .touchUpInside)

        partCountLabel.font = UIFont.monospacedDigitSystemFont(ofSize: 13.5, weight: .medium)
        partCountLabel.textAlignment = .right

        progressTrack.layer.cornerRadius = 4.5
        progressTrack.clipsToBounds = true
        progressTrack.backgroundColor = trackColor
        progressFill.layer.cornerRadius = 4.5
        progressFill.clipsToBounds = true
        progressTrack.addSubview(progressFill)

        configureRoundButton(minusButton, title: "-", filled: false)
        configureRoundButton(plusButton, title: "+", filled: true)
        minusButton.addTarget(self, action: #selector(decrement), for: .touchUpInside)
        plusButton.addTarget(self, action: #selector(increment), for: .touchUpInside)

        countLabel.font = KaleidoNativeFont.syne(size: 34, weightValue: 620, fallbackWeight: .semibold)
        countLabel.textAlignment = .center
        countLabel.textColor = .white

        timerButton.titleLabel?.font = UIFont.monospacedDigitSystemFont(ofSize: 12, weight: .heavy)
        timerButton.layer.cornerRadius = 10
        timerButton.clipsToBounds = true
        timerButton.contentEdgeInsets = UIEdgeInsets(top: 2, left: 8, bottom: 2, right: 8)
        timerButton.addTarget(self, action: #selector(toggleTimerMenu), for: .touchUpInside)

        timerMenu.layer.cornerRadius = 14
        timerMenu.clipsToBounds = true
        timerMenu.isHidden = true
        timerMenuLabel.textAlignment = .center
        timerMenuLabel.font = UIFont.monospacedDigitSystemFont(ofSize: 18, weight: .heavy)
        configureTimerMenuButton(timerToggleButton)
        configureTimerMenuButton(timerResetButton)
        timerToggleButton.addTarget(self, action: #selector(toggleTimer), for: .touchUpInside)
        timerResetButton.addTarget(self, action: #selector(resetTimer), for: .touchUpInside)
        [timerMenuLabel, timerToggleButton, timerResetButton].forEach(timerMenu.addSubview)

        clientButton.layer.cornerRadius = 11
        clientButton.clipsToBounds = true
        clientButton.setImage(UIImage(systemName: "person.fill"), for: .normal)
        clientButton.tintColor = UIColor(red: 0.655, green: 0.545, blue: 0.98, alpha: 1)
        clientButton.addTarget(self, action: #selector(openClient), for: .touchUpInside)

        unreadBadge.font = UIFont.systemFont(ofSize: 9, weight: .heavy)
        unreadBadge.textColor = .white
        unreadBadge.backgroundColor = UIColor(red: 0.957, green: 0.247, blue: 0.369, alpha: 1)
        unreadBadge.textAlignment = .center
        unreadBadge.layer.cornerRadius = 8
        unreadBadge.clipsToBounds = true

        [globalLabel, circleView, partButton, partCountLabel, progressTrack, minusButton, countLabel, plusButton, timerButton, timerMenu, clientButton, unreadBadge].forEach(addSubview)
    }

    func update(with object: JSObject?) {
        background = UIColor.kaleidoHex(object?["backgroundColor"] as? String) ?? background
        textColor = UIColor.kaleidoHex(object?["textColor"] as? String) ?? textColor
        trackColor = UIColor.kaleidoHex(object?["trackColor"] as? String) ?? trackColor
        accent = UIColor.kaleidoHex(object?["colorBg"] as? String) ?? accent
        accentLight = UIColor.kaleidoHex(object?["colorLight"] as? String) ?? accentLight
        let partName = (object?["currentPartieName"] as? String) ?? "Progression"
        let rang = intValue(object?["rang"])
        let total = intValue(object?["total"])
        let partRang = intValue(object?["rangDansPartie"])
        let partTotal = intValue(object?["totalPartieCourante"])
        let pct = max(0, min(100, intValue(object?["pct"])))
        let timeText = (object?["timeText"] as? String) ?? "00:00:00"
        let unread = intValue(object?["unreadClientMessageCount"])
        hasClient = boolValue(object?["hasClient"])
        isTimerRunning = boolValue(object?["isTimerRunning"])
        localProgress = CGFloat(max(0, min(100, intValue(object?["localProgress"])))) / 100

        backgroundColor = background
        progressTrack.backgroundColor = trackColor
        globalLabel.textColor = accent
        circleView.update(accent: accent, accentLight: accentLight, textColor: textColor, trackColor: trackColor, current: rang, total: total, percent: CGFloat(pct) / 100)
        partButton.setTitle(partName, for: .normal)
        partButton.setTitleColor(accent, for: .normal)
        partCountLabel.text = partTotal > 0 ? "\(partRang)/\(partTotal)" : "\(pct)%"
        partCountLabel.textColor = accent
        countLabel.text = partTotal > 0 ? "\(partRang)" : "\(rang)"
        countLabel.textColor = textColor
        progressFill.backgroundColor = accent

        minusButton.setTitleColor(accent, for: .normal)
        minusButton.layer.borderColor = accent.withAlphaComponent(0.55).cgColor
        minusButton.backgroundColor = accent.withAlphaComponent(0.14)
        plusButton.backgroundColor = accent
        UIView.performWithoutAnimation {
            timerButton.setTitle(timeText, for: .normal)
            timerMenuLabel.text = timeText
            timerButton.layoutIfNeeded()
        }
        timerButton.setTitleColor(textColor, for: .normal)
        timerButton.backgroundColor = isTimerRunning ? accent.withAlphaComponent(0.34) : UIColor.white.withAlphaComponent(0.08)
        timerButton.layer.borderWidth = 1
        timerButton.layer.borderColor = accentLight.withAlphaComponent(0.28).cgColor
        timerMenu.backgroundColor = background
        timerMenu.layer.borderWidth = 1
        timerMenu.layer.borderColor = accentLight.withAlphaComponent(0.32).cgColor
        timerMenuLabel.textColor = textColor
        timerToggleButton.setTitle(isTimerRunning ? "PAUSE" : "PLAY", for: .normal)
        timerToggleButton.backgroundColor = isTimerRunning ? UIColor(red: 0.863, green: 0.149, blue: 0.149, alpha: 1) : UIColor(red: 0.02, green: 0.588, blue: 0.412, alpha: 1)
        timerResetButton.setTitle("RESET", for: .normal)
        timerResetButton.backgroundColor = UIColor(red: 0.486, green: 0.227, blue: 0.929, alpha: 1)
        timerMenu.isHidden = !isTimerMenuOpen

        clientButton.isHidden = !hasClient
        clientButton.backgroundColor = unread > 0 ? UIColor(red: 0.957, green: 0.247, blue: 0.369, alpha: 0.18) : accent.withAlphaComponent(0.10)
        clientButton.layer.borderWidth = 1.7
        clientButton.layer.borderColor = (unread > 0 ? UIColor(red: 0.957, green: 0.247, blue: 0.369, alpha: 0.70) : accent.withAlphaComponent(0.48)).cgColor
        unreadBadge.isHidden = !hasClient || unread <= 0
        unreadBadge.text = unread > 9 ? "9+" : "\(unread)"
        setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        let top = max(0, safeAreaInsets.top - 12)
        let left: CGFloat = 6
        let right: CGFloat = 20
        let circleSize: CGFloat = 95
        let circleX = left
        globalLabel.frame = CGRect(x: circleX, y: top + 27, width: circleSize, height: 18)
        circleView.frame = CGRect(x: circleX, y: globalLabel.frame.maxY + 2, width: circleSize, height: circleSize)

        timerButton.frame = CGRect(x: bounds.width - right - 92, y: top + 21.5, width: 92, height: 20)
        timerMenu.frame = CGRect(x: bounds.width - right - 172, y: timerButton.frame.maxY + 8, width: 172, height: 86)
        timerMenuLabel.frame = CGRect(x: 10, y: 9, width: 152, height: 24)
        timerToggleButton.frame = CGRect(x: 10, y: 43, width: 72, height: 32)
        timerResetButton.frame = CGRect(x: 90, y: 43, width: 72, height: 32)

        let barX = circleView.frame.maxX + 8
        let barRight = bounds.width - right
        let barY = top + 75
        partButton.frame = CGRect(x: barX, y: barY - 31, width: max(60, barRight - barX - 54), height: 26)
        partCountLabel.frame = CGRect(x: barRight - 52, y: barY - 31, width: 52, height: 26)
        progressTrack.frame = CGRect(x: barX, y: barY, width: max(20, barRight - barX), height: 9)
        progressFill.frame = CGRect(x: 0, y: 0, width: progressTrack.bounds.width * localProgress, height: progressTrack.bounds.height)

        let buttonSize: CGFloat = 40
        let controlsY = progressTrack.frame.maxY + 13
        let centerX = barX + (progressTrack.frame.width / 2)
        countLabel.frame = CGRect(x: centerX - 24, y: controlsY - 1, width: 48, height: 42)
        minusButton.frame = CGRect(x: countLabel.frame.minX - buttonSize - 8, y: controlsY, width: buttonSize, height: buttonSize)
        plusButton.frame = CGRect(x: countLabel.frame.maxX + 8, y: controlsY, width: buttonSize, height: buttonSize)

        clientButton.frame = CGRect(x: circleView.frame.maxX + 10, y: controlsY + 1, width: 34, height: 34)
        unreadBadge.frame = CGRect(x: clientButton.frame.maxX - 9, y: clientButton.frame.minY - 5, width: 17, height: 15)
    }

    private func configureRoundButton(_ button: UIButton, title: String, filled: Bool) {
        button.setTitle(title, for: .normal)
        button.titleLabel?.font = KaleidoNativeFont.dmSans(size: 22, weightValue: 800, fallbackWeight: .heavy)
        button.layer.cornerRadius = 20
        button.clipsToBounds = true
        button.layer.borderWidth = filled ? 0 : 1.5
        button.setTitleColor(filled ? .white : accent, for: .normal)
    }

    private func configureTimerMenuButton(_ button: UIButton) {
        button.layer.cornerRadius = 10
        button.clipsToBounds = true
        button.setTitleColor(.white, for: .normal)
        button.titleLabel?.font = KaleidoNativeFont.dmSans(size: 11, weightValue: 800, fallbackWeight: .heavy)
    }

    private func intValue(_ value: Any?) -> Int {
        if let int = value as? Int { return int }
        if let double = value as? Double { return Int(double) }
        if let number = value as? NSNumber { return number.intValue }
        return 0
    }

    private func boolValue(_ value: Any?) -> Bool {
        if let bool = value as? Bool { return bool }
        if let number = value as? NSNumber { return number.boolValue }
        return false
    }

    @objc private func decrement() { onAction?("decrementRang") }
    @objc private func increment() { onAction?("incrementRang") }
    @objc private func toggleTimerMenu() {
        isTimerMenuOpen.toggle()
        timerMenu.isHidden = !isTimerMenuOpen
    }
    @objc private func toggleTimer() { onAction?("toggleTimer") }
    @objc private func resetTimer() { onAction?("resetTimer") }
    @objc private func openClient() { onAction?("openClientPage") }
    @objc private func openPartiePicker() { onAction?("openPartiePicker") }
}

final class KaleidoNativeCircleView: UIView {
    private let track = CAShapeLayer()
    private let progress = CAShapeLayer()
    private let currentLabel = UILabel()
    private let totalLabel = UILabel()
    private var accent = UIColor(red: 0.486, green: 0.227, blue: 0.929, alpha: 1)
    private var textColor = UIColor.white
    private var trackColor = UIColor.white.withAlphaComponent(0.12)
    private var percent: CGFloat = 0

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        layer.addSublayer(track)
        layer.addSublayer(progress)
        currentLabel.textAlignment = .center
        currentLabel.textColor = textColor
        currentLabel.font = KaleidoNativeFont.syne(size: 33, weightValue: 620, fallbackWeight: .semibold)
        totalLabel.textAlignment = .center
        totalLabel.font = UIFont.monospacedDigitSystemFont(ofSize: 13, weight: .semibold)
        addSubview(currentLabel)
        addSubview(totalLabel)
    }

    func update(accent: UIColor, accentLight: UIColor, textColor: UIColor, trackColor: UIColor, current: Int, total: Int, percent: CGFloat) {
        self.accent = accent
        self.textColor = textColor
        self.trackColor = trackColor
        self.percent = max(0, min(1, percent))
        currentLabel.text = "\(current)"
        currentLabel.textColor = textColor
        totalLabel.text = "/ \(total > 0 ? "\(total)" : "-")"
        totalLabel.textColor = accent
        progress.strokeColor = accent.cgColor
        setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        let rect = bounds.insetBy(dx: 7, dy: 7)
        let path = UIBezierPath(ovalIn: rect)
        track.path = path.cgPath
        track.fillColor = UIColor.clear.cgColor
        track.strokeColor = trackColor.cgColor
        track.lineWidth = 6
        progress.path = path.cgPath
        progress.fillColor = UIColor.clear.cgColor
        progress.strokeColor = accent.cgColor
        progress.lineWidth = 6
        progress.lineCap = .round
        progress.strokeStart = 0
        progress.strokeEnd = percent
        progress.transform = CATransform3DMakeRotation(-CGFloat.pi / 2, 0, 0, 1)
        progress.frame = bounds
        track.frame = bounds
        currentLabel.frame = CGRect(x: 0, y: bounds.midY - 30, width: bounds.width, height: 39)
        totalLabel.frame = CGRect(x: 0, y: bounds.midY + 5, width: bounds.width, height: 20)
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
