import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export const LaunchVideoPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(18.5);
  const [activeScene, setActiveScene] = useState('01: THE PROBLEM');

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    if (videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }

    if (t < 3.0) setActiveScene('01: THE PROBLEM (0-3s)');
    else if (t < 6.0) setActiveScene('02: MEET REVIVEAI (3-6s)');
    else if (t < 11.0) setActiveScene('03: KEY FEATURES (6-11s)');
    else if (t < 15.0) setActiveScene('04: SMART & SAFE (11-15s)');
    else setActiveScene('05: THE IMPACT (15-18.5s)');
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    const target = ratio * duration;
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const jumpTo = (timeSec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = timeSec;
    setCurrentTime(timeSec);
    if (!isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const mins = Math.floor(currentTime / 60);
  const secs = (currentTime % 60).toFixed(1).padStart(4, '0');

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#070A12]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition flex items-center gap-2 text-xs font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Website</span>
          </button>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" theme="dark" />
            <div>
              <h1 className="text-sm font-bold tracking-tight">ReviveAI Launch Premiere</h1>
              <p className="text-[11px] text-slate-400 font-mono">18.5s Cinematic SaaS Video</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/launch_video.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 transition flex items-center gap-1.5"
          >
            <span>Interactive Web Audio Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => navigate('/journey')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition"
          >
            Launch Command Center
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10 flex flex-col gap-8">
        
        {/* Video Player Card */}
        <div className="bg-[#0B0F19] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-950/20 flex flex-col">
          
          {/* HUD Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#070A12] text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>ACTIVE SCENE: {activeScene}</span>
            </div>
            <div className="text-slate-400">
              1080p Full HD &bull; 48kHz Stereo AAC
            </div>
          </div>

          {/* Video Stage */}
          <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
            <video
              ref={videoRef}
              src="/reviveai_product_launch.mp4"
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              autoPlay
              playsInline
            />

            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-slate-900/80 backdrop-blur-md border-2 border-cyan-400/80 text-cyan-300 flex items-center justify-center shadow-2xl shadow-cyan-500/40 hover:scale-105 transition"
              >
                <Play className="w-10 h-10 ml-1.5 fill-cyan-400" />
              </button>
            )}

            {/* Quick Scene Chips */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-auto">
              {[
                { label: '01 The Problem', time: 0 },
                { label: '02 Meet ReviveAI', time: 3 },
                { label: '03 Key Features', time: 6 },
                { label: '04 Smart & Safe', time: 11 },
                { label: '05 The Impact', time: 15 },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpTo(s.time);
                  }}
                  className="px-3 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="p-4 bg-[#070A12] border-t border-slate-800 space-y-3">
            <div
              onClick={handleSeek}
              className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden cursor-pointer relative group"
            >
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 transition-all duration-75 relative"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
                </button>

                <button
                  onClick={handleRestart}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Restart"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleMute}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <div className="text-xs font-mono text-slate-400">
                  <span className="text-white font-bold">{mins}:{secs}</span> / 0:18.5
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/reviveai_product_launch.mp4"
                  download="reviveai_product_launch.mp4"
                  className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Video (MP4)</span>
                </a>

                <button
                  onClick={toggleFullscreen}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid / Guardrails Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
            <h3 className="text-xs font-mono uppercase text-cyan-400 font-bold">Autonomous Intelligence</h3>
            <p className="text-sm font-semibold text-white">Closed-Loop Recovery Agent</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects gateway drops, diagnoses root cause error packets, dynamically routes between delayed retries and Smart PayLinks.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
            <h3 className="text-xs font-mono uppercase text-amber-400 font-bold">Financial Guardrails</h3>
            <p className="text-sm font-semibold text-white">Deterministic Governance</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Capped at &le;2 retries, mandatory human operator sign-off for &ge;₹50,000 INR, strict 24h window, instant termination on success.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
            <h3 className="text-xs font-mono uppercase text-emerald-400 font-bold">Explainable AI</h3>
            <p className="text-sm font-semibold text-white">Traceable Mathematical Audit</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every decision transparently exposes customer LTV weightings, gateway health telemetry, and cohort recovery confidence meters.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};
