"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Activity, 
  Brain, 
  Cpu, 
  Eye, 
  BarChart2, 
  AlertOctagon, 
  LogOut, 
  ChevronRight, 
  Layout,
  User,
  ShieldAlert,
  LogIn,
  HelpCircle,
  Play,
  Menu,
  X
} from "lucide-react";

// Import modules
import Canvas, { CanvasRef } from "@/components/Canvas";
import WebcamPredict from "@/components/WebcamPredict";
import BattleArena from "@/components/BattleArena";
import XAIModule from "@/components/XAIModule";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import ErrorExplorer from "@/components/ErrorExplorer";
import type { XAIPredictionData } from "@/components/XAIModule";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<CanvasRef>(null);
  
  // Dashboard Tabs / Views
  const [activeTab, setActiveTab] = useState<"sandbox" | "battle" | "xai" | "analytics" | "errors">("sandbox");
  // Canvas model selection (inside sandbox)
  const [selectedModel, setSelectedModel] = useState<string>("cnn");
  // Sandbox prediction trigger (so we can pass latest prediction details to XAIModule)
  const [latestPrediction, setLatestPrediction] = useState<XAIPredictionData | null>(null);
  
  const [token, setToken] = useState<string | null>(null);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authentication check (non-blocking)
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    setToken(savedToken);
  }, []);

  // Force CNN model when advanced/developer mode is disabled
  useEffect(() => {
    if (!showAdvanced) {
      setSelectedModel("cnn");
    }
  }, [showAdvanced]);

  // Close sidebar on tab navigation (mobile helper)
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

  // Handle URL triggered auto-demo
  useEffect(() => {
    const isDemo = searchParams.get("demo") === "true";
    if (isDemo && canvasRef.current && !isDemoRunning) {
      setIsDemoRunning(true);
      setActiveTab("sandbox");
      setSelectedModel("cnn");
      
      // Delay slightly for canvas initialization
      setTimeout(() => {
        canvasRef.current?.startDemo(() => {
          setIsDemoRunning(false);
          // Automatically switch to Explainable AI tab once drawing and prediction completes
          setTimeout(() => {
            setActiveTab("xai");
          }, 1200);
        });
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, canvasRef]);

  // Read and switch to specific tab from URL query parameters
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["sandbox", "battle", "xai", "analytics", "errors"].includes(tabParam)) {
      setActiveTab(tabParam as "sandbox" | "battle" | "xai" | "analytics" | "errors");
    }
  }, [searchParams]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    router.push("/");
  };

  const handlePredictionCallback = (data: XAIPredictionData) => {
    setLatestPrediction(data);
  };

  const triggerDemo = () => {
    if (isDemoRunning || !canvasRef.current) return;
    setIsDemoRunning(true);
    setActiveTab("sandbox");
    setSelectedModel("cnn");
    
    setTimeout(() => {
      canvasRef.current?.startDemo(() => {
        setIsDemoRunning(false);
        setTimeout(() => {
          setActiveTab("xai");
        }, 1200);
      });
    }, 500);
  };

  const showGatedLock = !token && (activeTab === "analytics" || activeTab === "errors");

  return (
    <div className="min-h-screen bg-background flex text-slate-100 font-sans relative overflow-x-hidden">
      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0a0b12]/95 lg:bg-[#0a0b12]/80 border-r border-white/5 flex flex-col justify-between p-6 z-50 lg:z-20 backdrop-blur-xl transition-transform duration-300 lg:transition-none lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="space-y-8 relative">
          {/* Close button on Mobile */}
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden absolute top-0 right-0 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors focus:outline-none"
            aria-label="Close sidebar"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 text-white font-bold text-md tracking-wider">
            <Activity className="h-5.5 w-5.5 text-cyan-400 glow-pulse" />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              NeuralVision AI
            </span>
          </Link>

          {/* Nav Items */}
          <nav className="space-y-1">
            <button
              onClick={triggerDemo}
              disabled={isDemoRunning}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 hover:from-cyan-500/20 hover:to-violet-500/20 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 hover:text-white transition-all cursor-pointer mb-5 disabled:opacity-50"
            >
              <Play className={`h-3.5 w-3.5 ${isDemoRunning ? 'animate-pulse' : ''}`} />
              <span>{isDemoRunning ? "Playing Demo..." : "Watch AI Think (Demo)"}</span>
            </button>

            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block px-3 mb-2">Workspace</span>
            
            <button
              onClick={() => setActiveTab("sandbox")}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
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
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
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
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
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
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
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
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
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
              <div className="text-[9px] text-slate-500 font-mono">
                {token ? "Connected" : "Guest Sandbox"}
              </div>
            </div>
          </div>
          {token ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-500/5 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors rounded-xl hover:bg-cyan-500/5 cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>Login / Sign Up</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col z-10 overflow-y-auto lg:pl-64 w-full">
        {/* Workspace Header Banner */}
        <header className="h-16 border-b border-white/5 px-4 sm:px-8 flex items-center justify-between bg-[#0a0b12]/30 backdrop-blur-md">
          <div className="flex items-center">
            {/* Hamburger button on Mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors focus:outline-none mr-2.5"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <Layout className="h-4.5 w-4.5 text-slate-400 hidden xs:block" />
              <h2 className="text-[10px] xs:text-xs font-semibold uppercase tracking-wider text-slate-300">
                {activeTab === "sandbox" ? "Interactive Sandbox" :
                 activeTab === "battle" ? "Model Battle Arena" :
                 activeTab === "xai" ? "Explainable AI Viewer" :
                 activeTab === "analytics" ? "Training Curves & Confusion Matrix" :
                 "Incorrect prediction explorer"}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Advanced Insights Toggle */}
            <button
              onClick={() => setShowAdvanced(prev => !prev)}
              className={`px-3 py-1.5 text-[9px] xs:text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${
                showAdvanced 
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                  : "bg-slate-950/40 text-slate-500 border-white/5 hover:text-slate-300"
              }`}
            >
              {showAdvanced ? "Hide Dev Controls" : "Show Dev Controls"}
            </button>
          </div>
        </header>

        {/* View Port Panel */}
        <div className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {showGatedLock ? (
            /* Database progressive gate overlay */
            <div className="flex flex-col items-center justify-center p-6 sm:p-12 text-center border border-white/5 rounded-3xl glass h-[400px] relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-rose-500/5 rounded-bl-full filter blur-2xl" />
              <ShieldAlert className="h-12 w-12 text-rose-400 mb-4 animate-pulse" />
              <h4 className="text-lg font-bold text-white mb-2">Database Logging Access Required</h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
                To view persistent training curves, flag incorrect predictions, and log history tables, you must connect to the secure relational database.
              </p>
              <Link
                href="/login"
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Login or Sign Up</span>
              </Link>
            </div>
          ) : (
            <>
              {activeTab === "sandbox" && (
                <div className="space-y-12">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/5 pb-4 gap-4">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-white">Digit Input Workspace</h3>
                      <p className="text-xs text-slate-400">
                        Draw a digit inside the box. Visual explanations (XAI) will compute automatically when you release.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {isDemoRunning && (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-cyan-950/30 border border-cyan-500/20 rounded-full text-[10px] text-cyan-400 font-mono">
                          <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-ping" />
                          <span>Autoplaying Demo...</span>
                        </div>
                      )}
                      
                      {showAdvanced && (
                        <div className="flex items-center space-x-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-white/5 relative">
                          <span className="text-[10px] text-slate-500 font-mono uppercase">Neural Model:</span>
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            aria-label="Select neural network model"
                            className="bg-slate-950 border border-white/10 rounded px-2 py-0.5 text-xs text-cyan-400 outline-none cursor-pointer hover:border-cyan-500/20"
                          >
                            <option value="cnn">CNN (Champion)</option>
                            <option value="ann">ANN (Dense)</option>
                            <option value="perceptron">Perceptron</option>
                          </select>
                          
                          <div
                            onMouseEnter={() => setHoveredTerm(selectedModel)}
                            onMouseLeave={() => setHoveredTerm(null)}
                            className="cursor-help text-slate-400 hover:text-white"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </div>

                          {hoveredTerm && (
                            <div className="absolute right-0 top-10 w-64 bg-slate-950/95 border border-white/10 p-3 rounded-xl shadow-2xl z-50 text-[11px] text-slate-300 leading-normal font-sans select-text">
                              {selectedModel === "cnn" && "CNN (Convolutional Neural Network): Scans the canvas segments. Excels at extracting shape curves and diagonals."}
                              {selectedModel === "ann" && "ANN (Dense): Flat layer representation. Looks at pixels individually without spatial connections."}
                              {selectedModel === "perceptron" && "Perceptron: Simplest structure. Runs a simple linear decision boundary."}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View 1: Canvas Drawing */}
                  <div className="glass p-3.5 sm:p-6 lg:p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-40 w-40 bg-cyan-500/5 rounded-bl-full filter blur-2xl pointer-events-none" />
                    <Canvas ref={canvasRef} onPredict={handlePredictionCallback} selectedModel={selectedModel} />
                  </div>

                  {/* View 2: Webcam & File Upload */}
                  <div className="glass p-3.5 sm:p-6 lg:p-8 rounded-3xl border border-white/5">
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
                  <XAIModule predictionData={latestPrediction} onTriggerDemo={triggerDemo} />
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06070d]" />}>
      <DashboardContent />
    </Suspense>
  );
}
