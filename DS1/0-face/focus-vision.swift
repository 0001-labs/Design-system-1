// Image focus with Apple's Vision framework: the faces in each picture and the part a person looks at
// first (attention-based saliency), as JSON for `focusFromRegions()` in focus.ts. macOS only; a build
// script runs it where it can and falls back to `focusOf()` elsewhere.
//
//   swift focus-vision.swift photo.jpg other.jpg …
//   {"photo.jpg":{"faces":[{"x":0.41,"y":0.12,"w":0.18,"h":0.14}],"salient":[…]}, …}
//
// Boxes are fractions of the picture, from its top left corner, as the web measures them.
import Foundation
import Vision

func box(_ rect: CGRect) -> [String: Double] {
  ["x": rect.minX, "y": 1 - rect.maxY, "w": rect.width, "h": rect.height]
}

var result: [String: [String: [[String: Double]]]] = [:]
for path in CommandLine.arguments.dropFirst() {
  let url = URL(fileURLWithPath: path)
  let faces = VNDetectFaceRectanglesRequest()
  let salient = VNGenerateAttentionBasedSaliencyImageRequest()
  let handler = VNImageRequestHandler(url: url, options: [:])
  do { try handler.perform([faces, salient]) } catch {
    FileHandle.standardError.write("\(path): \(error.localizedDescription)\n".data(using: .utf8)!)
    continue
  }
  let found = (faces.results ?? []).filter { $0.confidence > 0.6 }.map { box($0.boundingBox) }
  let objects = (salient.results?.first?.salientObjects ?? []).map { box($0.boundingBox) }
  result[url.lastPathComponent] = ["faces": found, "salient": objects]
}
let data = try JSONSerialization.data(withJSONObject: result, options: [.sortedKeys])
FileHandle.standardOutput.write(data)
