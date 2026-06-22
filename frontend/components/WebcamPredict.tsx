"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Video, StopCircle, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "../config";
import type { XAIPredictionData } from "./XAIModule";


interface WebcamPredictProps {
  onPredict: (data: XAIPredictionData) => void;
  selectedModel: string;
}

interface InferenceResponse extends XAIPredictionData {
  predicted_class: number;
  confidence: number;
  latency_ms: number;
  preprocessed_image?: string;
}

export default function WebcamPredict({ onPredict, selectedModel }: WebcamPredictProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isAnalyzingRef = useRef(false);

  const [activeTab, setActiveTab] = useState<"webcam" | "upload">("upload");
  const [cameraActive, setCameraActive] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [preprocessedImg, setPreprocessedImg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true); // Default mirrored for selfie cameras

  // Hidden canvas for frame capturing
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  // Toggle Webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: "user" 
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.error("Error playing video:", err));
      }
      setCameraActive(true);
      startAnalyzing();
    } catch (err) {
      console.error("Error accessing camera: ", err);
      alert("Could not access camera. Please verify permissions or check if another app is using it.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setCameraActive(false);
    setIsProcessing(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Frame processing and prediction
  const captureFrameAndPredict = async () => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;

    const video = videoRef.current;
    const canvas = hiddenCanvasRef.current;
    if (!video || !canvas || video.paused || video.ended) {
      isAnalyzingRef.current = false;
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      isAnalyzingRef.current = false;
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for transform reset
    ctx.save();

    // Get source video resolutions
    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;

    // Crop a central square region (60% of smallest dimension) to focus on the target box area
    const size = Math.min(videoWidth, videoHeight) * 0.6;
    const sx = (videoWidth - size) / 2;
    const sy = (videoHeight - size) / 2;

    if (isMirrored) {
      // Mirror the context so the drawn image is also flipped (matches screen)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Draw the cropped central region of the video frame onto the hidden canvas
    ctx.drawImage(
      video,
      sx,
      sy,
      size,
      size,
      0,
      0,
      canvas.width,
      canvas.height
    );
    
    // Restore transform state
    ctx.restore();
    
    // Grab compressed base64 JPEG to significantly reduce network payload size
    const dataUrl = canvas.toDataURL("image/jpeg", 0.45);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/predict/canvas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_data: dataUrl,
          source: "webcam",
          model_type: selectedModel,
          explain: false // Disable expensive explainability maps for live webcam polling
        })
      });

      if (!response.ok) throw new Error("API error");

      const data = (await response.json()) as InferenceResponse;
      setPrediction(data.predicted_class);
      setConfidence(data.confidence);
      setLatency(data.latency_ms);
      setPreprocessedImg(data.preprocessed_image || null);
      onPredict(data);
    } catch (err) {
      console.error("Frame prediction error:", err);
    } finally {
      isAnalyzingRef.current = false;
    }
  };

  const startAnalyzing = () => {
    setIsProcessing(true);
    
    const analyzeLoop = async () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        await captureFrameAndPredict();
      }
      animationFrameRef.current = requestAnimationFrame(analyzeLoop);
    };

    animationFrameRef.current = requestAnimationFrame(analyzeLoop);
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setUploadedImage(dataUrl);

      // Trigger prediction for uploaded image
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/predict/canvas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_data: dataUrl,
            source: "upload",
            model_type: selectedModel,
            explain: true // Enable explainability maps for upload
          })
        });

        if (!response.ok) throw new Error("API error");

        const data = (await response.json()) as InferenceResponse;
        setPrediction(data.predicted_class);
        setConfidence(data.confidence);
        setLatency(data.latency_ms);
        setPreprocessedImg(data.preprocessed_image || null);
        onPredict(data);
      } catch (err) {
        console.error("Uploaded image prediction error:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
      {/* Selector Tabs */}
      <div className="flex flex-col items-center w-full max-w-md">
        <div className="flex space-x-2 p-1 bg-slate-950/80 border border-white/5 rounded-xl w-full mb-6">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab("upload");
            }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 text-sm rounded-lg transition-all cursor-pointer ${
              activeTab === "upload" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Image Upload</span>
          </button>
          <button
            onClick={() => setActiveTab("webcam")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 text-sm rounded-lg transition-all cursor-pointer ${
              activeTab === "webcam" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Live Webcam</span>
          </button>
        </div>

        {/* Tab Content: Upload */}
        {activeTab === "upload" && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full h-72 rounded-2xl glass border border-white/10 flex flex-col items-center justify-center p-4 relative overflow-hidden group">
              {uploadedImage ? (
                <>
                  <img
                    src={uploadedImage}
                    alt="Uploaded preview"
                    className="w-full h-full object-contain rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <label className="px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-white hover:text-cyan-400 cursor-pointer transition-colors">
                      Change Image
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer border-2 border-dashed border-white/5 hover:border-cyan-500/30 rounded-xl transition-colors">
                  <ImageIcon className="h-12 w-12 text-slate-500 group-hover:text-cyan-400 transition-colors mb-3" />
                  <span className="text-sm font-medium text-slate-300">Drag & drop or click to upload</span>
                  <span className="text-xs text-slate-500 mt-1">Supports PNG, JPG, JPEG</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Webcam */}
        {activeTab === "webcam" && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full h-72 rounded-2xl glass border border-white/10 flex items-center justify-center relative overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isMirrored ? "scale-x-[-1]" : ""} ${cameraActive ? "block" : "hidden"}`}
              />
              {cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-44 h-44 border-2 border-dashed border-cyan-400/50 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center bg-cyan-950/5">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-cyan-400 bg-slate-950/80 px-2 py-1 rounded border border-cyan-500/20">
                      Align Digit Here
                    </span>
                  </div>
                </div>
              )}
              {!cameraActive && (
                <div className="flex flex-col items-center">
                  <Video className="h-12 w-12 text-slate-600 mb-2" />
                  <p className="text-sm text-slate-400">Webcam stream inactive</p>
                </div>
              )}
            </div>
 
            {/* Controls */}
            <div className="flex justify-center items-center gap-3 mt-4">
              {cameraActive && (
                <button
                  onClick={() => setIsMirrored(prev => !prev)}
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-900 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all cursor-pointer text-xs font-medium text-slate-300 hover:text-white"
                  title="Toggle mirroring. Mirror is best for user-facing selfie cameras; unmirror is best if showing digits via rear camera."
                >
                  <RefreshCw className="h-3 w-3 text-cyan-400" />
                  <span>{isMirrored ? "Unmirror" : "Mirror"}</span>
                </button>
              )}
              {cameraActive ? (
                <button
                  onClick={stopCamera}
                  className="flex items-center space-x-2 px-5 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer text-sm font-medium"
                >
                  <StopCircle className="h-4 w-4" />
                  <span>Stop Stream</span>
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="flex items-center space-x-2 px-5 py-2 btn-cyber rounded-xl text-sm font-medium"
                >
                  <Camera className="h-4 w-4" />
                  <span>Start Live Stream</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
 
      {/* Hidden Canvas for Webcam frame captures */}
      <canvas ref={hiddenCanvasRef} width={150} height={150} className="hidden" />

      {/* Results View */}
      <div className="flex flex-col w-full max-w-sm glass p-6 rounded-2xl border border-white/5">
        <h3 className="text-sm font-semibold tracking-wide text-white uppercase mb-6 flex items-center space-x-2">
          <RefreshCw className={`h-4 w-4 text-cyan-400 ${isProcessing ? 'animate-spin' : ''}`} />
          <span>Real-Time Output</span>
        </h3>

        <div className="flex items-center space-x-6 mb-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 flex items-center justify-center border border-white/10 relative">
            <span className="text-5xl font-black text-white tracking-tighter">
              {prediction !== null ? prediction : "-"}
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Confidence Score</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              {confidence !== null ? `${(confidence * 100).toFixed(1)}%` : "0.0%"}
            </div>
            {latency && (
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                Latency: {latency.toFixed(1)} ms
              </div>
            )}
          </div>
        </div>

        {preprocessedImg && (
          <div className="flex flex-col items-center justify-center p-3 mb-4 bg-slate-950/60 border border-white/5 rounded-xl">
            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-2">AI Input View (28x28 MNIST format)</span>
            <img
              src={preprocessedImg}
              alt="Preprocessed preview"
              className="w-16 h-16 bg-black border border-white/10 rounded"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        )}

        <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-4">
          {activeTab === "webcam" ? (
            "Ensure the handwritten digit is fully visible in the center of the camera frame. The model performs real-time preprocessing (grayscale conversion, color inversion, resizing, and normalization)."
          ) : (
            "Select a digit image from your device. The image will be centered, cropped, and normalized automatically to match the MNIST format before running prediction."
          )}
        </p>
      </div>
    </div>
  );
}
