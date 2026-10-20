import Foundation
import CoreGraphics
import CoreText
import ImageIO
import UniformTypeIdentifiers

let base = URL(fileURLWithPath:CommandLine.arguments[1])
let width=1280, height=720, fps=30, frameCount=300
let ink="172443",teal="087F8C",gold="E7A127"
func clamp(_ x:Double)->Double {min(1,max(0,x))}
func ease(_ x:Double)->Double {let p=clamp(x);return p*p*(3-2*p)}
func color(_ s:String)->CGColor {let n=UInt64(s,radix:16) ?? 0;return CGColor(srgbRed:Double((n>>16)&255)/255,green:Double((n>>8)&255)/255,blue:Double(n&255)/255,alpha:1)}
func line(_ c:CGContext,_ a:CGPoint,_ b:CGPoint,_ col:String,_ w:Double=3) {c.setStrokeColor(color(col));c.setLineWidth(w);c.setLineCap(.round);c.move(to:a);c.addLine(to:b);c.strokePath()}
func rect(_ c:CGContext,_ r:CGRect,_ col:String,_ radius:Double=12) {c.setFillColor(color(col));c.addPath(CGPath(roundedRect:r,cornerWidth:radius,cornerHeight:radius,transform:nil));c.fillPath()}
func text(_ c:CGContext,_ s:String,_ x:Double,_ y:Double,_ size:Double,_ col:String,_ fit:Double=1100) {
 var sz=size
 func make(_ z:Double)->CTLine {let f=CTFontCreateWithName("HelveticaNeue-Medium" as CFString,z,nil);return CTLineCreateWithAttributedString(NSAttributedString(string:s,attributes:[NSAttributedString.Key(kCTFontAttributeName as String):f,NSAttributedString.Key(kCTForegroundColorAttributeName as String):color(col)]))}
 var l=make(sz);var b=CTLineGetBoundsWithOptions(l,.useOpticalBounds)
 if b.width>fit {sz=max(12,sz*fit/b.width);l=make(sz);b=CTLineGetBoundsWithOptions(l,.useOpticalBounds)}
 c.textMatrix = .identity;c.textPosition=CGPoint(x:x-b.width/2,y:y);CTLineDraw(l,c)
}
struct Node:Decodable {
 let kind:String
 let x:Double?,y:Double?,w:Double?,h:Double?,color:String?,stroke:String?,width:Double?,strokeWidth:Double?,radius:Double?,size:Double?,fit:Double?,text:String?
 let points:[[Double]]?,trajectory:[[Double]]?
 let dx:Double?,dy:Double?,dx0:Double?,dy0:Double?,dh:Double?,sx0:Double?,sx1:Double?,sy0:Double?,sy1:Double?,angle0:Double?,angle1:Double?,anchorX:Double?,anchorY:Double?,start:Double?,end:Double?,alpha:Double?,delay:Double?,fadeOut:Double?,swap:Bool?
}
struct Episode:Decodable {let id:String,index:Int,formula:String,nodes:[Node],video:String,poster:String}
struct Pack:Decodable {let episodes:[Episode]}
func drawNode(_ c:CGContext,_ n:Node,_ t:Double) {
 let begin=n.start ?? 2,end=n.end ?? 6
 let p=ease((t-begin)/max(0.001,end-begin))
 var opacity=n.alpha ?? 1
 if let delay=n.delay,delay>0 {opacity *= ease((t-delay)/0.35)}
 if let end=n.fadeOut,end>0 {opacity *= 1-ease((t-(end-0.25))/0.25)}
 if opacity<0.001{return}
 c.saveGState();defer{c.restoreGState()};c.setAlpha(opacity)
 var x=(n.x ?? 0)+(n.dx0 ?? 0)*(1-p)+(n.dx ?? 0)*p,y=(n.y ?? 0)+(n.dy0 ?? 0)*(1-p)+(n.dy ?? 0)*p
 if let traj=n.trajectory,!traj.isEmpty {let f=p*Double(traj.count-1);let i=min(traj.count-1,Int(f));let j=min(traj.count-1,i+1);let a=f-Double(i);x=traj[i][0]+(traj[j][0]-traj[i][0])*a;y=traj[i][1]+(traj[j][1]-traj[i][1])*a}
 if n.kind=="moa" {x=min(1170,max(110,x));y=min(550,max(240,y))}
 let ax=n.anchorX ?? 0,ay=n.anchorY ?? 0
 if n.swap==true {c.translateBy(x:640,y:400);c.concatenate(CGAffineTransform(a:1-p,b:p,c:p,d:1-p,tx:0,ty:0));c.translateBy(x:-640,y:-400)}
 c.translateBy(x:x,y:y)
 if n.kind != "hand" && n.kind != "arc" && n.kind != "sector" {
  c.translateBy(x:ax,y:ay);c.rotate(by:(n.angle0 ?? 0)+((n.angle1 ?? n.angle0 ?? 0)-(n.angle0 ?? 0))*p)
  c.scaleBy(x:(n.sx0 ?? 1)+((n.sx1 ?? 1)-(n.sx0 ?? 1))*p,y:(n.sy0 ?? 1)+((n.sy1 ?? 1)-(n.sy0 ?? 1))*p);c.translateBy(x:-ax,y:-ay)
 }
 let col=n.color ?? teal,w=n.w ?? 0,h=(n.h ?? n.w ?? 0)+(n.dh ?? 0)*p
 c.setFillColor(color(col));c.setStrokeColor(color(n.stroke ?? col));c.setLineWidth(n.width ?? n.strokeWidth ?? 3);c.setLineJoin(.round);c.setLineCap(.round)
 switch n.kind {
 case "text":text(c,n.text ?? "",0,0,n.size ?? 30,col,n.fit ?? 1100)
 case "rect":rect(c,CGRect(x:0,y:0,width:max(0,w),height:max(0,h)),col,n.radius ?? 8)
 case "circle","ellipse":
  c.fillEllipse(in:CGRect(x:-w,y:-h,width:2*w,height:2*h));if n.stroke != nil {c.strokeEllipse(in:CGRect(x:-w,y:-h,width:2*w,height:2*h))}
 case "ring":c.strokeEllipse(in:CGRect(x:-w,y:-h,width:2*w,height:2*h))
 case "line","path","polygon":
  guard let points=n.points,!points.isEmpty else{return};c.beginPath();c.addLines(between:points.map{CGPoint(x:$0[0],y:$0[1])});if n.kind=="polygon" {c.closePath();c.drawPath(using:.fillStroke)}else{c.strokePath()}
 case "hand":
  let a=(n.angle0 ?? 0)+((n.angle1 ?? 0)-(n.angle0 ?? 0))*p;line(c,.zero,CGPoint(x:w*cos(a),y:w*sin(a)),col,n.width ?? 4)
 case "arc","sector":
  c.beginPath();if n.kind=="sector" {c.move(to:.zero)}
  c.addArc(center:.zero,radius:w,startAngle:n.angle0 ?? 0,endAngle:n.angle1 ?? Double.pi,clockwise:false)
  if n.kind=="sector" {c.closePath();c.fillPath()}else{c.strokePath()}
 case "moa":
  // Original LIFE.HELP pictogram: navy figure, red ball, no facial protrusions.
  let navy="0E2456", red="B22132"
  let phase=t.truncatingRemainder(dividingBy:5)
  let stride=sin(t*5)*3
  // A compact footprint preserves the mathematical diagram's clear space.
  line(c,CGPoint(x:-4,y:-5),CGPoint(x:-10+stride,y:-30),navy,8)
  line(c,CGPoint(x:4,y:-5),CGPoint(x:12-stride,y:-30),navy,8)
  rect(c,CGRect(x:-9,y:-8,width:18,height:30),navy,8)
  c.setFillColor(color(navy));c.fillEllipse(in:CGRect(x:-9,y:26,width:18,height:18))
  let hold=phase>3.5
  let handY=hold ? 43.0 : 5.0
  line(c,CGPoint(x:-8,y:17),CGPoint(x:hold ? -13 : -20,y:hold ? 36 : 0),navy,6)
  line(c,CGPoint(x:8,y:17),CGPoint(x:20,y:handY),navy,6)
  if hold {line(c,CGPoint(x:-13,y:36),CGPoint(x:5,y:49),navy,6);line(c,CGPoint(x:20,y:43),CGPoint(x:9,y:49),navy,6)}
  let ballX=hold ? 7.0 : 23.0
  let ballY=hold ? 53.0 : -20+25*abs(cos(t*5))
  c.setFillColor(color(red));c.fillEllipse(in:CGRect(x:ballX-7,y:ballY-7,width:14,height:14))

 default:fatalError("unsupported scene node \(n.kind)")
 }
}
func frame(_ c:CGContext,_ e:Episode,_ n:Int) {
 let t=Double(n)/30
 c.setFillColor(color("F7F9FD"));c.fill(CGRect(x:0,y:0,width:width,height:height));rect(c,CGRect(x:36,y:183,width:1208,height:433),"FFFFFF",28)
 text(c,String(format:"MATH.LIFE.HELP · %03d",e.index),195,657,24,teal,350)
 for i in 0..<4 {rect(c,CGRect(x:1050+i*36,y:660,width:24,height:5),i<Int(t/2.5)+1 ? teal : "DDE4EC",2)}
 c.saveGState();c.clip(to:CGRect(x:55,y:190,width:1170,height:420));for node in e.nodes {drawNode(c,node,t)};c.restoreGState()
 rect(c,CGRect(x:100,y:48,width:1080,height:108),"E9EDF9",22)
 let formula=e.formula
 if formula.count>80 {
  let words=formula.split(separator:" ");var a="",b=""
  for w in words {if a.count<formula.count/2 {a += (a.isEmpty ? "":" ")+w}else{b += (b.isEmpty ? "":" ")+w}}
  text(c,a,640,111,30,ink,1020);text(c,b,640,71,30,ink,1020)
 }else {text(c,formula,640,91,38,ink,1020)}
}
func png(_ image:CGImage,_ url:URL) {let d=CGImageDestinationCreateWithURL(url as CFURL,UTType.png.identifier as CFString,1,nil)!;CGImageDestinationAddImage(d,image,nil);CGImageDestinationFinalize(d)}
func render(_ e:Episode)throws {
 let url=base.appendingPathComponent(e.video),encoder=Process();encoder.executableURL=URL(fileURLWithPath:ProcessInfo.processInfo.environment["MATH_FFMPEG"] ?? "/private/tmp/math-video-ffmpeg")
 encoder.arguments=["-hide_banner","-loglevel","error","-y","-f","rawvideo","-pixel_format","argb","-video_size","1280x720","-framerate","30","-i","pipe:0","-an","-c:v","libx264","-preset","veryfast","-crf","22","-pix_fmt","yuv420p","-movflags","+faststart",url.path]
 let pipe=Pipe();encoder.standardInput=pipe;try encoder.run()
 let bytes=width*height*4;let memory=UnsafeMutableRawPointer.allocate(byteCount:bytes,alignment:64);defer{memory.deallocate()}
 let c=CGContext(data:memory,width:width,height:height,bitsPerComponent:8,bytesPerRow:width*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.noneSkipFirst.rawValue)!
 for n in 0..<frameCount {try autoreleasepool {
  frame(c,e,n)
  if [0,90,180,240,299].contains(n){png(c.makeImage()!,base.appendingPathComponent(String(format:"posters/%@-%03d.png",e.id,n)))}
  try pipe.fileHandleForWriting.write(contentsOf:Data(bytesNoCopy:memory,count:bytes,deallocator:.none))
 }}
 try pipe.fileHandleForWriting.close();encoder.waitUntilExit();guard encoder.terminationStatus==0 else{throw NSError(domain:"encoding",code:Int(encoder.terminationStatus))}
}
let pack=try JSONDecoder().decode(Pack.self,from:Data(contentsOf:base.appendingPathComponent("render-scenes.json")))
let selector=CommandLine.arguments.count>2 ? CommandLine.arguments[2] : "all"
let items=selector=="all" ? pack.episodes : pack.episodes.filter{e in selector.split(separator:",").contains(Substring(e.id)) || selector.split(separator:",").contains(Substring(String(e.index)))}
for (i,e) in items.enumerated() {
 if ProcessInfo.processInfo.environment["MATH_SKIP_EXISTING"]=="1" && FileManager.default.fileExists(atPath:base.appendingPathComponent(e.video).path){continue}
 try render(e)
 print("\(i+1)/\(items.count) \(e.id) \(e.index)");fflush(stdout)
}
