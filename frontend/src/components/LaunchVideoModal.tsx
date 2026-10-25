import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface LaunchVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LaunchVideoModal: React.FC<LaunchVideoModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(18.5);
  const [activeScene, setActiveScene] = useState('01: THE PROBLEM');

  useEffect(() => {
    if (isOpen) {
      setCurrentTime(0);
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Autoplay policy might mute or require user interaction
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#030712]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B0F19] border border-cyan-500/30 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col relative text-white">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#070A12]/80">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold tracking-tight">ReviveAI — Product Launch Video</h3>
              <p className="text-xs text-slate-400 font-mono">18.5s Cinematic SaaS Premiere &bull; {activeScene}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/launch_video.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 transition flex items-center gap-1.5"
              title="Open full interactive Web Audio player in new tab"
            >
              <span>Interactive Player</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas / Player Container */}
        <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
          <video
            ref={videoRef}
            src="/reviveai_product_launch.mp4"
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            playsInline
          />

          {/* Big Center Play Button when paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-slate-900/80 backdrop-blur-md border-2 border-cyan-400/80 text-cyan-300 flex items-center justify-center shadow-xl shadow-cyan-500/30 hover:scale-105 transition"
            >
              <Play className="w-8 h-8 ml-1 fill-cyan-400" />
            </button>
          )}

          {/* Scene Quick Jump Chips Overlay */}
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
                className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Player Controls */}
        <div className="p-4 bg-[#070A12] border-t border-slate-800 space-y-3">
          {/* Scrubber Bar */}
          <div
            onClick={handleSeek}
            className="h-2 w-full bg-slate-800 rounded-full overflow-hidden cursor-pointer relative group"
          >
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 transition-all duration-75 relative"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
              </button>

              <button
                onClick={handleRestart}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleMute}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
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
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download MP4</span>
              </a>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
