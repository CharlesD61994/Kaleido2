import UIKit
import WebKit
import Capacitor
import ObjectiveC.runtime

class KaleidoBridgeViewController: CAPBridgeViewController {
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        removeKeyboardAccessoryBar()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        removeKeyboardAccessoryBar()
    }

    private func removeKeyboardAccessoryBar() {
        guard let webView = self.webView else { return }
        removeInputAccessoryBar(from: webView)
    }

    private func removeInputAccessoryBar(from view: UIView) {
        let className = String(describing: type(of: view))

        if className.contains("WKContentView") {
            disableInputAccessoryView(for: view)
        }

        for subview in view.subviews {
            removeInputAccessoryBar(from: subview)
        }
    }

    private func disableInputAccessoryView(for view: UIView) {
        guard let originalClass = object_getClass(view) else { return }
        let originalClassName = NSStringFromClass(originalClass)
        let subclassName = "\(originalClassName)_KaleidoNoInputAccessoryView"

        let subclass: AnyClass
        if let existingSubclass = NSClassFromString(subclassName) {
            subclass = existingSubclass
        } else if let createdSubclass = objc_allocateClassPair(originalClass, subclassName, 0) {
            let selector = NSSelectorFromString("inputAccessoryView")
            let block: @convention(block) (AnyObject) -> Any? = { _ in nil }
            class_addMethod(createdSubclass, selector, imp_implementationWithBlock(block), "@@:")
            objc_registerClassPair(createdSubclass)
            subclass = createdSubclass
        } else {
            return
        }

        if object_getClass(view) !== subclass {
            object_setClass(view, subclass)
        }
    }
}
