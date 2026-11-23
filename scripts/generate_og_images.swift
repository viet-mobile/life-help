import AppKit
import Foundation

let sourceLogoPath = "/Users/juboklee/.gemini/antigravity/brain/3725b963-fd5a-4e26-b6c2-bdb3c91df306/.user_uploaded/media_1795390768403_9956d651.jpg"
let publicDir = "/Users/juboklee/life-project/life-help/public"
let logosDir = "/Users/juboklee/life-project/life-help/public/logos"

guard let sourceImage = NSImage(contentsOfFile: sourceLogoPath) else {
    print("[-] Failed to load source logo from \(sourceLogoPath)")
    exit(1)
}

func renderOGImage(subject: String?, outputPath: String) {
    let width: CGFloat = 1200
    let height: CGFloat = 630
    
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let context = CGContext(
        data: nil,
        width: Int(width),
        height: Int(height),
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else {
        print("[-] Failed to create CGContext")
        return
    }
    
    let graphicsContext = NSGraphicsContext(cgContext: context, flipped: false)
    NSGraphicsContext.current = graphicsContext
    
    // 1. Fill clean pure white background with subtle gentle gradient
    let rect = CGRect(x: 0, y: 0, width: width, height: height)
    context.setFillColor(CGColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0))
    context.fill(rect)
    
    // Subtle background framing
    let innerFrame = CGRect(x: 24, y: 24, width: width - 48, height: height - 48)
    context.setStrokeColor(CGColor(red: 0.92, green: 0.94, blue: 0.96, alpha: 1.0))
    context.setLineWidth(2.0)
    let path = CGPath(roundedRect: innerFrame, cornerWidth: 28, cornerHeight: 28, transform: nil)
    context.addPath(path)
    context.strokePath()

    // 2. Logo drawing dimensions
    // The source logo is square 1024x1024
    let logoSize: CGFloat = subject == nil ? 480 : 420
    let logoX = (width - logoSize) / 2
    let logoY = subject == nil ? (height - logoSize) / 2 : ((height - logoSize) / 2) - 30
    
    if let cgSource = sourceImage.cgImage(forProposedRect: nil, context: nil, hints: nil) {
        context.draw(cgSource, in: CGRect(x: logoX, y: logoY, width: logoSize, height: logoSize))
    }
    
    // 3. If subject is specified, draw the subject name in bold typography above the logo
    if let subjectText = subject {
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .center
        
        let font = NSFont.systemFont(ofSize: 44, weight: .heavy)
        let subjectColor: NSColor
        switch subjectText.uppercased() {
        case "KOREAN":
            subjectColor = NSColor(red: 0.43, green: 0.22, blue: 0.85, alpha: 1.0) // Violet
        case "ENGLISH":
            subjectColor = NSColor(red: 0.08, green: 0.52, blue: 0.88, alpha: 1.0) // Sky
        case "MATH":
            subjectColor = NSColor(red: 0.05, green: 0.65, blue: 0.40, alpha: 1.0) // Emerald
        case "PHYSICS":
            subjectColor = NSColor(red: 0.31, green: 0.35, blue: 0.92, alpha: 1.0) // Indigo
        case "CHEMISTRY":
            subjectColor = NSColor(red: 0.06, green: 0.60, blue: 0.62, alpha: 1.0) // Teal
        default:
            subjectColor = NSColor(red: 0.08, green: 0.15, blue: 0.35, alpha: 1.0) // Navy
        }
        
        let attrs: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: subjectColor,
            .paragraphStyle: paragraphStyle,
            .kern: 4.0 // Letter spacing
        ]
        
        let textY = logoY + logoSize + 15
        let textRect = CGRect(x: 0, y: textY, width: width, height: 60)
        let attrString = NSAttributedString(string: subjectText.uppercased(), attributes: attrs)
        attrString.draw(in: textRect)
    }
    
    // 4. Save to destination PNG
    if let imageRef = context.makeImage() {
        let bitmapRep = NSBitmapImageRep(cgImage: imageRef)
        if let pngData = bitmapRep.representation(using: .png, properties: [:]) {
            try? pngData.write(to: URL(fileURLWithPath: outputPath))
            print("[+] Rendered OG image to: \(outputPath)")
        }
    }
}

// Generate Main OG image
renderOGImage(subject: nil, outputPath: "\(publicDir)/og.png")

// Generate 5 Subject OG images
renderOGImage(subject: "KOREAN", outputPath: "\(publicDir)/og-korean.png")
renderOGImage(subject: "ENGLISH", outputPath: "\(publicDir)/og-english.png")
renderOGImage(subject: "MATH", outputPath: "\(publicDir)/og-math.png")
renderOGImage(subject: "PHYSICS", outputPath: "\(publicDir)/og-physics.png")
renderOGImage(subject: "CHEMISTRY", outputPath: "\(publicDir)/og-chemistry.png")

// Also render 512x512 logo files for public/logos/logo-{subject}.png
func renderSquareLogo(subject: String?, outputPath: String) {
    let size: CGFloat = 512
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let context = CGContext(
        data: nil,
        width: Int(size),
        height: Int(size),
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else { return }
    
    let graphicsContext = NSGraphicsContext(cgContext: context, flipped: false)
    NSGraphicsContext.current = graphicsContext
    
    context.setFillColor(CGColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0))
    context.fill(CGRect(x: 0, y: 0, width: size, height: size))
    
    let logoSize: CGFloat = subject == nil ? 460 : 380
    let logoX = (size - logoSize) / 2
    let logoY = subject == nil ? (size - logoSize) / 2 : 30
    
    if let cgSource = sourceImage.cgImage(forProposedRect: nil, context: nil, hints: nil) {
        context.draw(cgSource, in: CGRect(x: logoX, y: logoY, width: logoSize, height: logoSize))
    }
    
    if let subjectText = subject {
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .center
        let font = NSFont.systemFont(ofSize: 40, weight: .heavy)
        let subjectColor: NSColor
        switch subjectText.uppercased() {
        case "KOREAN": subjectColor = NSColor(red: 0.43, green: 0.22, blue: 0.85, alpha: 1.0)
        case "ENGLISH": subjectColor = NSColor(red: 0.08, green: 0.52, blue: 0.88, alpha: 1.0)
        case "MATH": subjectColor = NSColor(red: 0.05, green: 0.65, blue: 0.40, alpha: 1.0)
        case "PHYSICS": subjectColor = NSColor(red: 0.31, green: 0.35, blue: 0.92, alpha: 1.0)
        case "CHEMISTRY": subjectColor = NSColor(red: 0.06, green: 0.60, blue: 0.62, alpha: 1.0)
        default: subjectColor = NSColor(red: 0.08, green: 0.15, blue: 0.35, alpha: 1.0)
        }
        
        let attrs: [NSAttributedString.Key: Any] = [
            .font: font,
            .foregroundColor: subjectColor,
            .paragraphStyle: paragraphStyle,
            .kern: 3.0
        ]
        let textY = logoY + logoSize + 10
        let textRect = CGRect(x: 0, y: textY, width: size, height: 50)
        NSAttributedString(string: subjectText.uppercased(), attributes: attrs).draw(in: textRect)
    }
    
    if let imageRef = context.makeImage() {
        let bitmapRep = NSBitmapImageRep(cgImage: imageRef)
        if let pngData = bitmapRep.representation(using: .png, properties: [:]) {
            try? pngData.write(to: URL(fileURLWithPath: outputPath))
            print("[+] Rendered Square Logo to: \(outputPath)")
        }
    }
}

renderSquareLogo(subject: nil, outputPath: "\(logosDir)/logo-default.png")
renderSquareLogo(subject: nil, outputPath: "\(logosDir)/life-help-round-logo.png")
renderSquareLogo(subject: "KOREAN", outputPath: "\(logosDir)/logo-korean.png")
renderSquareLogo(subject: "ENGLISH", outputPath: "\(logosDir)/logo-english.png")
renderSquareLogo(subject: "MATH", outputPath: "\(logosDir)/logo-math.png")
renderSquareLogo(subject: "PHYSICS", outputPath: "\(logosDir)/logo-physics.png")
renderSquareLogo(subject: "CHEMISTRY", outputPath: "\(logosDir)/logo-chemistry.png")
