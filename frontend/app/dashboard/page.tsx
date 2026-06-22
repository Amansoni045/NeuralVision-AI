"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Activity, 
  Brain, 
  Camera, 
  Cpu, 
  Eye, 
  BarChart2, 
  AlertOctagon, 
  LogOut, 
  ChevronRight, 
  Layout,
  User
} from "lucide-react";

// Import modules
import Canvas from "@/components/Canvas";
import WebcamPredict from "@/components/WebcamPredict";
import BattleArena from "@/components/BattleArena";
import XAIModule from "@/components/XAIModule";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import ErrorExplorer from "@/components/ErrorExplorer";
import type { XAIPredictionData } from "@/components/XAIModule";

export default function Dashboard() {
  const router = useRouter();
  
  // Dashboard Tabs / Views
  const [activeTab, setActiveTab] = useState<"sandbox" | "battle" | "xai" | "analytics" | "errors">("sandbox");
  // Canvas model selection (inside sandbox)
  const [selectedModel, setSelectedModel] = useState<string>("cnn");
  // Sandbox prediction trigger (so we can pass latest prediction details to XAIModule)
  const [latestPrediction, setLatestPrediction] = useState<XAIPredictionData | null>(null);

  // Authentication check
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const handlePredictionCallback = (data: XAIPredictionData) => {
    setLatestPrediction(data);
  };

  return (
    <div className="min-h-screen bg-background flex text-slate-100 font-sans select-none">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0a0b12]/80 border-r border-white/5 flex flex-col justify-between p-6 z-10 backdrop-blur-xl">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center space-x-2 text-white font-bold text-md tracking-wider">
            <Activity className="h-5.5 w-5.5 text-cyan-400 glow-pulse" />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              NeuralVision AI
            </span>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block px-3 mb-2">Workspace</span>
            
            <button
              onClick={() => setActiveTab("sandbox")}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "sandbox" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Brain className="h-4 w-4" />
                <span>Interactive Sandbox</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab("battle")}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "battle" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Cpu className="h-4 w-4" />
                <span>Battle Arena</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab("xai")}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "xai" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Eye className="h-4 w-4" />
                <span>Explainable AI (XAI)</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-50" />
            </button>

            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block px-3 pt-6 mb-2">Metrics & MLOps</span>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "analytics" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BarChart2 className="h-4 w-4" />
                <span>Analytics Dashboard</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab("errors")}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === "errors" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <AlertOctagon className="h-4 w-4" />
                <span>Error Explorer</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-50" />
            </button>
          </nav>
        </div>

        {/* Footer controls */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          <div className="flex items-center space-x-3 px-3">
            <div className="h-8 w-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <User className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Developer</div>
              <div className="text-[9px] text-slate-500 font-mono">Status: Authenticated</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-500/5 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col z-10 overflow-y-auto">
        {/* Workspace Header Banner */}
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-[#0a0b12]/30 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <Layout className="h-4.5 w-4.5 text-slate-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {activeTab === "sandbox" ? "Interactive Sandbox" :
               activeTab === "battle" ? "Model Battle Arena" :
               activeTab === "xai" ? "Explainable AI Viewer" :
               activeTab === "analytics" ? "Training Curves & Confusion Matrix" :
               "Incorrect prediction explorer"}
            </h2>
          </div>

          {/* Dynamic control for sandbox active model selector */}
          {activeTab === "sandbox" && (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Active Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-slate-950/80 border border-white/5 rounded-lg px-3 py-1 text-xs text-slate-300 outline-none cursor-pointer hover:border-cyan-500/20"
              >
                <option value="perceptron">Perceptron</option>
                <option value="ann">ANN (Dense)</option>
                <option value="cnn">CNN (Champion)</option>
              </select>
            </div>
          )}
        </header>

        {/* View Port Panel */}
        <div className="flex-1 p-8 max-w-6xl w-full mx-auto">
          {activeTab === "sandbox" && (
            <div className="space-y-12">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white mb-2">Digit Input Workspace</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Draw a digit in the drawing box, or toggle to the Media tab to capture camera frames or upload local images.
                </p>
              </div>

              {/* View 1: Canvas Drawing */}
              <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-cyan-500/5 rounded-bl-full filter blur-2xl" />
                <Canvas onPredict={handlePredictionCallback} selectedModel={selectedModel} />
              </div>

              {/* View 2: Webcam & File Upload */}
              <div className="glass p-8 rounded-3xl border border-white/5">
                <WebcamPredict onPredict={handlePredictionCallback} selectedModel={selectedModel} />
              </div>
            </div>
          )}

          {activeTab === "battle" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white mb-2">Model Battle Arena</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compare all three network architectures side-by-side. View parallel classification predictions, confidence metrics, parameter counts, and real-time execution speeds.
                </p>
              </div>
              <BattleArena />
            </div>
          )}

          {activeTab === "xai" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white mb-2">Explainable AI (XAI)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Inspect the convolutional layer activation maps and Grad-CAM visual overlays. See exactly which regions of your digit triggered the CNN prediction.
                </p>
              </div>
              <XAIModule predictionData={latestPrediction} />
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white mb-2">Training & MLOps Analytics</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Analyze training curves, loss histories, accuracy scores, and interactive confusion matrices logged during model training runs.
                </p>
              </div>
              <AnalyticsDashboard />
            </div>
          )}

          {activeTab === "errors" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white mb-2">Error Explorer</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Review incorrect predictions logged during your sandbox runs. Filter by class, and flag the true labels to dynamically update the analytics hub.
                </p>
              </div>
              <ErrorExplorer />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
