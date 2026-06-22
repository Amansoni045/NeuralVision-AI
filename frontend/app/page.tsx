"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Brain, 
  Cpu, 
  Eye, 
  AlertCircle,
  HelpCircle,
  Play,
  Sparkles,
  LogIn
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ThreeBackground from "@/components/ThreeBackground";
import Canvas, { CanvasRef } from "@/components/Canvas";
import XAIModule, { XAIPredictionData } from "@/components/XAIModule";
import BattleArena from "@/components/BattleArena";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

function HomeContent() {
  const canvasRef = useRef<CanvasRef>(null);
  const searchParams = useSearchParams();
  
  const [selectedModel, setSelectedModel] = useState<string>("cnn");
  const [latestPrediction, setLatestPrediction] = useState<XAIPredictionData | null>(null);
  
  // Guided Flow & Progressive Disclosure State
  const [currentLevel, setCurrentLevel] = useState<"beginner" | "advanced" | "expert">("beginner");
  const [predictionReceived, setPredictionReceived] = useState(false);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);

  // Sync tab level with query parameters (e.g. ?level=advanced)
  useEffect(() => {
    const level = searchParams.get("level");
    if (level === "advanced" || level === "expert" || level === "beginner") {
      setCurrentLevel(level);
    }
  }, [searchParams]);

  const handlePredict = (data: XAIPredictionData) => {
    setLatestPrediction(data);
    setPredictionReceived(true);
  };

  const startRecruiterDemo = () => {
    if (isDemoPlaying) return;
    setIsDemoPlaying(true);
    setPredictionReceived(false);
    setSelectedModel("cnn");
    setCurrentLevel("beginner");

    if (canvasRef.current) {
      canvasRef.current.startDemo(() => {
        setIsDemoPlaying(false);
        // Automatically unlock advanced view after demo finishes drawing
        setTimeout(() => {
          setCurrentLevel("advanced");
        }, 1200);
      });
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* 3D Animated Network Background */}
      <ThreeBackground />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-grid pointer-events-none z-0" />

      {/* Navigation Header */}
      <Navbar />

      {/* Main Experience */}
      <main className="flex-1 flex flex-col items-center pt-24 pb-16 px-4 z-10 max-w-6xl mx-auto w-full">
        
        {/* Hero & Intro storytelling section */}
        <section className="text-center space-y-4 max-w-3xl mt-8 mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-cyan-400 font-mono tracking-wide">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>Interactive Explainable Deep Learning Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-white">
            Draw a number.
            <span className="block mt-1 bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
              Watch AI understand it.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed max-w-xl mx-auto">
            Experience how a Convolutional Neural Network recognizes handwritten digits in real time. Sketch below or click the automated demo.
          </p>

          <div className="flex justify-center items-center gap-4 pt-2">
            <button
              onClick={startRecruiterDemo}
              disabled={isDemoPlaying}
              className="px-6 py-2.5 text-xs font-semibold tracking-wide btn-cyber rounded-xl shadow-lg flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isDemoPlaying ? "Demo Drawing..." : "See How It Works (Auto Demo)"}</span>
            </button>
          </div>
        </section>

        {/* Level Selector (Progressive Disclosure tabs) */}
        <div className="w-full max-w-4xl flex items-center justify-between p-1 bg-slate-950/80 border border-white/5 rounded-2xl mb-8">
          <button
            onClick={() => setCurrentLevel("beginner")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              currentLevel === "beginner" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"
            }`}
          >
            <Brain className="h-4 w-4" />
            <span>1. Beginner Workspace</span>
          </button>
          <button
            onClick={() => setCurrentLevel("advanced")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              currentLevel === "advanced" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>2. Advanced Audits</span>
          </button>
          <button
            onClick={() => setCurrentLevel("expert")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              currentLevel === "expert" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>3. Expert Metrics</span>
          </button>
        </div>

        {/* Tab content renders based on selected level */}
        <div className="w-full max-w-4xl space-y-12">
          
          {/* LEVEL 1: BEGINNER WORKSPACE */}
          {currentLevel === "beginner" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Digit Drawing & Instant Prediction</h2>
                  <p className="text-xs text-slate-400">Sketch inside the box. AI reads your stroke patterns instantly.</p>
                </div>
                {/* Simple model selection with details */}
                <div className="flex items-center space-x-2.5 bg-slate-900/50 p-2 rounded-xl border border-white/5 relative">
                  <span className="text-[10px] text-slate-400 font-mono">Neural Model:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-cyan-400 outline-none cursor-pointer"
                  >
                    <option value="cnn">CNN (Champion Model)</option>
                    <option value="ann">ANN (Standard Flat Network)</option>
                    <option value="perceptron">Perceptron (Single Layer)</option>
                  </select>
                  
                  {/* Tooltip trigger */}
                  <div 
                    onMouseEnter={() => setHoveredTerm(selectedModel)}
                    onMouseLeave={() => setHoveredTerm(null)}
                    className="cursor-help text-slate-400 hover:text-white"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </div>

                  {hoveredTerm && (
                    <div className="absolute right-0 top-12 w-64 bg-slate-950/95 border border-white/10 p-3 rounded-xl shadow-2xl z-50 text-[11px] text-slate-300 leading-normal font-sans">
                      {selectedModel === "cnn" && "CNN (Convolutional Neural Network): Simulates human visual processing by scanning canvas segments. Best for digits."}
                      {selectedModel === "ann" && "ANN (Artificial Neural Network): Simple layers looking at pixels individually. Moderate accuracy."}
                      {selectedModel === "perceptron" && "Perceptron: Simplest model. Draws straight boundary lines to separate classes. Weak on complex curves."}
                    </div>
                  )}
                </div>
              </div>

              {/* Main Drawing Interactive Block */}
              <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-cyan-500/5 rounded-bl-full filter blur-2xl pointer-events-none" />
                <Canvas ref={canvasRef} onPredict={handlePredict} selectedModel={selectedModel} />
              </div>

              {/* Explanation guidance card */}
              {predictionReceived && latestPrediction && (
                <div className="glass p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-4 animate-slideUp">
                  <div className="flex items-center space-x-3.5">
                    <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Unlock Explainable visualizers (Grad-CAM)</h4>
                      <p className="text-xs text-slate-400 leading-normal">
                        Ready to see which regions of the stroke the AI evaluated to identify this digit? Expand the Advanced tab.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentLevel("advanced")}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 font-semibold text-xs rounded-lg hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Examine AI Brain
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LEVEL 2: ADVANCED AUDITS */}
          {currentLevel === "advanced" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-white/5 pb-4">
                <h2 className="text-lg font-bold text-white">Explainable AI (XAI) & Layer Activations</h2>
                <p className="text-xs text-slate-400">See exactly how the CNN extracts edge representations and makes decisions.</p>
              </div>

              {predictionReceived ? (
                <XAIModule predictionData={latestPrediction} />
              ) : (
                <div className="glass p-12 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-slate-500 animate-pulse" />
                  <h4 className="text-base font-bold text-slate-300">Awaiting Prediction Input</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Draw a digit in the **Beginner Workspace** first, or run the **Auto Demo** to populate Grad-CAM and activation maps.
                  </p>
                  <button
                    onClick={() => setCurrentLevel("beginner")}
                    className="px-4 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs text-slate-300 transition-all cursor-pointer"
                  >
                    Go back & draw
                  </button>
                </div>
              )}

              {/* Battle Arena section for comparison */}
              <div className="pt-6">
                <div className="border-b border-white/5 pb-4 mb-6">
                  <h3 className="text-base font-bold text-white">Parallel Model Battle Arena</h3>
                  <p className="text-xs text-slate-400">Compare Perceptron, ANN, and CNN processing speeds and decisions side-by-side.</p>
                </div>
                <BattleArena />
              </div>
            </div>
          )}

          {/* LEVEL 3: EXPERT METRICS */}
          {currentLevel === "expert" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-white/5 pb-4">
                <h2 className="text-lg font-bold text-white">MLOps & Model Training Analytics</h2>
                <p className="text-xs text-slate-400">Review learning rates, confusion matrices, and parameter metrics logged in MLflow.</p>
              </div>

              <AnalyticsDashboard />

              {/* Call-to-action warning */}
              <div className="glass p-8 rounded-3xl border border-white/5 bg-slate-950/30 text-center space-y-4 relative overflow-hidden">
                <div className="absolute -top-10 -left-10 h-24 w-24 bg-cyan-500/10 rounded-full filter blur-xl" />
                <h4 className="text-sm font-semibold text-white">Persistent Classification Logging</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Sign up for an account to save your canvas drawings, inspect error hubs, flag false model predictions, and contribute logs to model training.
                </p>
                <div className="flex justify-center pt-2">
                  <Link
                    href="/login"
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Developer Access Login</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full z-10 glass border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <p>&copy; 2026 NeuralVision AI. Built for scalable MLOps, deep learning, and advanced computer vision analytics.</p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06070d]" />}>
      <HomeContent />
    </Suspense>
  );
}
