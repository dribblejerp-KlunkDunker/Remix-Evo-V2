import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Download,
  CheckCircle2,
  X,
  Terminal,
  ShieldCheck,
  Sparkles,
  Apple,
  Monitor,
  Copy,
  Check,
  Zap,
  HardDrive,
  Info,
  ShieldAlert,
  ArrowDownToLine,
  HelpCircle,
  AlertTriangle,
  FolderDown,
  Play,
  RotateCcw,
  Stethoscope,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerDownload } from '../utils/downloadHelper';

interface LaptopInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'cros' | 'pwa' | 'windows' | 'mac' | 'troubleshoot';
}

type TabType = 'cros' | 'pwa' | 'windows' | 'mac' | 'troubleshoot';

export const LaptopInstallModal: React.FC<LaptopInstallModalProps> = ({
  isOpen,
  onClose,
  initialTab,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<TabType>('cros');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadingDeb, setDownloadingDeb] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadedDebSuccess, setDownloadedDebSuccess] = useState(false);
  const [downloadedZipSuccess, setDownloadedZipSuccess] = useState(false);
  const [detectedOS, setDetectedOS] = useState<string>('Detecting...');
  const [openTroubleshootItem, setOpenTroubleshootItem] = useState<string | null>('archive-signature');

  // Detect Client Operating System on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('cros') || ua.includes('chromebook')) {
        setDetectedOS('ChromeOS / Chromebook');
        if (!initialTab) setActiveTab('cros');
      } else if (ua.includes('win')) {
        setDetectedOS('Windows');
        if (!initialTab) setActiveTab('windows');
      } else if (ua.includes('mac')) {
        setDetectedOS('macOS');
        if (!initialTab) setActiveTab('mac');
      } else if (ua.includes('linux')) {
        setDetectedOS('Linux');
        if (!initialTab) setActiveTab('cros');
      } else {
        setDetectedOS('Desktop');
      }
    }
  }, [initialTab]);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadDeb = async () => {
    setDownloadingDeb(true);
    setDownloadedDebSuccess(false);
    try {
      await triggerDownload('/api/download/deb', 'remix-evo_0.2.0_amd64.deb');
      setDownloadedDebSuccess(true);
    } finally {
      setDownloadingDeb(false);
    }
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    setDownloadedZipSuccess(false);
    try {
      await triggerDownload('/api/download/desktop-bundle', 'remix-evo-desktop.zip');
      setDownloadedZipSuccess(true);
    } finally {
      setDownloadingZip(false);
    }
  };

  const toggleTroubleshoot = (id: string) => {
    setOpenTroubleshootItem(openTroubleshootItem === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="laptop-install-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="laptop-install-title" className="text-base font-bold text-white tracking-wide">
                  Install Remix Evo on Your Laptop
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 rounded-full">
                  v0.2.0 Native
                </span>
                {detectedOS && (
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-800/40 rounded-full">
                    Detected: {detectedOS}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-featured autonomous matrix agent engine running locally on your hardware
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-1 overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setActiveTab('cros')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'cros'
                ? 'border-emerald-500 text-emerald-300 font-bold bg-emerald-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4 text-emerald-400" />
            Chromebook & Linux (.deb)
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'pwa'
                ? 'border-purple-500 text-purple-300 font-bold bg-purple-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-purple-400" />
            1-Click Desktop App (PWA)
          </button>
          <button
            onClick={() => setActiveTab('windows')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'windows'
                ? 'border-sky-500 text-sky-300 font-bold bg-sky-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4 text-sky-400" />
            Windows 10/11
          </button>
          <button
            onClick={() => setActiveTab('mac')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'mac'
                ? 'border-indigo-500 text-indigo-300 font-bold bg-indigo-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple className="w-4 h-4 text-indigo-400" />
            macOS
          </button>
          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'troubleshoot'
                ? 'border-amber-500 text-amber-300 font-bold bg-amber-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-amber-400" />
            Troubleshooting & Fixes
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: CHROMEBOOK & LINUX (.DEB)                         */}
          {/* ======================================================== */}
          {activeTab === 'cros' && (
            <div className="space-y-6">
              {/* Primary Download Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 rounded">
                      Official Package
                    </span>
                    <span className="text-xs font-mono text-slate-300">remix-evo_0.2.0_amd64.deb</span>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">(45 MB)</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    Standalone Debian / Chromebook Linux Package
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Self-contained installer with isolated Node 22 binary, pre-bundled dependencies, global <code className="text-emerald-400">remix-evo</code> CLI, and ChromeOS app drawer shortcuts.
                  </p>
                </div>

                <button
                  onClick={handleDownloadDeb}
                  disabled={downloadingDeb}
                  className={`px-5 py-3 rounded-xl font-mono text-xs font-bold shadow-lg flex items-center gap-2.5 cursor-pointer transition transform active:scale-95 whitespace-nowrap ${
                    downloadedDebSuccess
                      ? 'bg-emerald-700 text-white border border-emerald-400'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  <ArrowDownToLine className={`w-4 h-4 ${downloadingDeb ? 'animate-spin' : ''}`} />
                  {downloadingDeb
                    ? 'Streaming (45 MB)...'
                    : downloadedDebSuccess
                    ? 'Downloaded to Downloads! (Click to re-download)'
                    : 'Download .deb Package (45 MB)'}
                </button>
              </div>

              {/* TWO EASY INSTALL PATHWAYS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Method A: ChromeOS Files App 1-Click GUI */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono uppercase tracking-wide">
                      <FolderDown className="w-4 h-4" />
                      Method 1: ChromeOS 1-Click GUI (Recommended)
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                      No Terminal
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    ChromeOS can install this package natively without running any terminal commands:
                  </p>

                  <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <li>Click the green <strong className="text-emerald-300">Download .deb</strong> button above.</li>
                    <li>Open your Chromebook's native <strong className="text-white">Files</strong> app.</li>
                    <li>Navigate to your <strong className="text-white">Downloads</strong> folder.</li>
                    <li><strong className="text-white">Right-click</strong> <code className="text-emerald-300 text-[11px]">remix-evo_0.2.0_amd64.deb</code>.</li>
                    <li>Click <strong className="text-emerald-300">"Install with Linux"</strong> in the menu.</li>
                    <li>Click <strong className="text-white">Install</strong> &rarr; ChromeOS will install everything automatically!</li>
                  </ol>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Adds "Remix Evo" to your Chromebook App Launcher immediately.</span>
                  </div>
                </div>

                {/* Method B: Terminal Installation via Drag & Drop or APT */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono uppercase tracking-wide">
                      <Terminal className="w-4 h-4" />
                      Method 2: Linux Terminal Install
                    </div>
                    <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-mono">
                      apt install
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    If you prefer installing via the Chromebook Linux terminal (<code className="text-purple-300">penguin</code>):
                  </p>

                  <div className="space-y-2">
                    <div className="text-[11px] text-slate-400">
                      Step 1: In the Chromebook Files app, drag <code className="text-slate-200">remix-evo_0.2.0_amd64.deb</code> from <strong>Downloads</strong> into <strong>Linux files</strong>.
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Step 2: Run in your Linux terminal:
                    </div>

                    <div className="relative">
                      <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{`# Install with automatic dependency resolution:
sudo apt install ./remix-evo_0.2.0_amd64.deb

# Launch Remix Evo:
remix-evo start`}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(`sudo apt install ./remix-evo_0.2.0_amd64.deb\nremix-evo start`, 'cros-apt')}
                        className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 bg-slate-950/80 px-2 py-1 rounded border border-slate-700 cursor-pointer"
                      >
                        {copiedKey === 'cros-apt' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                        {copiedKey === 'cros-apt' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                    <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Opens browser automatically at <code className="text-slate-300">http://localhost:7317</code>.</span>
                  </div>
                </div>
              </div>

              {/* Built-in CLI Commands Reference */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    Global Command-Line Reference (remix-evo)
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">Run anytime from terminal</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-emerald-400 font-bold">remix-evo start</span>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">Starts background server & opens browser</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-emerald-400 font-bold">remix-evo status</span>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">Checks PID, port, and health</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-emerald-400 font-bold">remix-evo doctor</span>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">Runs complete environment diagnostics</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-emerald-400 font-bold">remix-evo setkey</span>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">Sets or updates GEMINI_API_KEY</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-emerald-400 font-bold">remix-evo logs</span>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">Live stream server & evolution logs</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-emerald-400 font-bold">remix-evo stop</span>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">Gracefully stops the background daemon</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: 1-CLICK PWA DESKTOP APP                           */}
          {/* ======================================================== */}
          {activeTab === 'pwa' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-indigo-950/40 border border-purple-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-mono font-semibold text-emerald-400">
                      {isInstalled ? 'Installed on This Device' : 'Universal 1-Click Install (Zero Setup)'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    Install Standalone Window App
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                    Runs in its own distraction-free desktop window with no browser URL bar. Pins to your Chromebook shelf, Windows taskbar, or Mac dock with offline support.
                  </p>
                </div>

                {isInstalled ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Desktop App Active
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={async () => {
                      const success = await install();
                      if (success) {
                        onClose();
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer transition transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Install Standalone App Now
                  </button>
                ) : (
                  <div className="px-4 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-mono">
                    Use Browser Install Icon (URL Bar)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-sky-400 text-sm font-semibold">
                    <Monitor className="w-4 h-4" />
                    Chromebook, Chrome & Edge
                  </div>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Look at the top right of your browser's address bar.</li>
                    <li>Click the <span className="font-semibold text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Install</span> icon (a monitor with down-arrow).</li>
                    <li>Click <strong className="text-white">Install</strong> when prompted.</li>
                    <li>Remix Evo instantly launches as a native desktop app!</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold">
                    <Apple className="w-4 h-4" />
                    macOS Safari (Sonoma+)
                  </div>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>In the Safari top menu bar, click <strong className="text-white">File</strong>.</li>
                    <li>Select <span className="font-semibold text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Add to Dock...</span></li>
                    <li>Confirm the name as <em>Remix Evo</em> and click <strong className="text-white">Add</strong>.</li>
                    <li>Launches directly from your Dock with native macOS window borders!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: WINDOWS 10/11                                     */}
          {/* ======================================================== */}
          {activeTab === 'windows' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-bold bg-sky-900/80 text-sky-300 border border-sky-500/40 rounded">
                      Windows Package
                    </span>
                    <span className="text-xs font-mono text-slate-300">remix-evo-desktop.zip (1 MB)</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    Windows Desktop Runner Bundle
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg">
                    Includes 1-click batch launcher (<code className="text-sky-300">remix-evo-win.bat</code>), dependency verification, and local engine server.
                  </p>
                </div>

                <button
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center gap-2.5 cursor-pointer transition transform active:scale-95 whitespace-nowrap disabled:opacity-50"
                >
                  <ArrowDownToLine className={`w-4 h-4 ${downloadingZip ? 'animate-spin' : ''}`} />
                  {downloadingZip ? 'Downloading (1 MB)...' : 'Download Windows Bundle (ZIP)'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                  Windows 3-Step Setup Instructions:
                </h4>
                <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                  <li>Download and extract <strong className="text-sky-300">remix-evo-desktop.zip</strong> to any folder on your laptop.</li>
                  <li>Double-click <strong className="text-emerald-400 font-mono">remix-evo-win.bat</strong>.</li>
                  <li>The batch script will verify Node.js, install packages, and automatically open your default browser to <code className="text-slate-200 font-mono">http://localhost:3000</code>.</li>
                </ol>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Requires Node.js 20 or 22 installed on Windows (download from nodejs.org if not present).</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: MACOS                                             */}
          {/* ======================================================== */}
          {activeTab === 'mac' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-bold bg-indigo-900/80 text-indigo-300 border border-indigo-500/40 rounded">
                      macOS Package
                    </span>
                    <span className="text-xs font-mono text-slate-300">remix-evo-desktop.zip (1 MB)</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    macOS MacBook Desktop Runner
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg">
                    Includes macOS launcher script (<code className="text-indigo-300">remix-evo-mac-linux.sh</code>) and full local environment.
                  </p>
                </div>

                <button
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2.5 cursor-pointer transition transform active:scale-95 whitespace-nowrap disabled:opacity-50"
                >
                  <ArrowDownToLine className={`w-4 h-4 ${downloadingZip ? 'animate-spin' : ''}`} />
                  {downloadingZip ? 'Downloading (1 MB)...' : 'Download macOS Bundle (ZIP)'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                  MacBook Setup Instructions:
                </h4>
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">
                    Extract the zip in Finder, open Terminal in that folder, and run:
                  </p>
                  <div className="relative">
                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-300">
{`chmod +x remix-evo-mac-linux.sh
./remix-evo-mac-linux.sh`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`chmod +x remix-evo-mac-linux.sh\n./remix-evo-mac-linux.sh`, 'mac-sh')}
                      className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 bg-slate-950/80 px-2 py-1 rounded border border-slate-700 cursor-pointer"
                    >
                      {copiedKey === 'mac-sh' ? <Check className="w-3 h-3 text-indigo-300" /> : <Copy className="w-3 h-3" />}
                      {copiedKey === 'mac-sh' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: TROUBLESHOOTING & DIAGNOSTICS                     */}
          {/* ======================================================== */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Quick fixes for common installation errors encountered on Chromebook and Linux terminals.</span>
              </div>

              <div className="space-y-2.5">
                {/* Accordion 1: Invalid archive signature */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                  <button
                    onClick={() => toggleTroubleshoot('archive-signature')}
                    className="w-full flex items-center justify-between p-3.5 text-left text-xs font-mono font-bold text-slate-200 hover:text-white hover:bg-slate-900/50 cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2 text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                      Error: "Invalid archive signature" or "could not locate member control.tar"
                    </span>
                    {openTroubleshootItem === 'archive-signature' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {openTroubleshootItem === 'archive-signature' && (
                    <div className="p-4 border-t border-slate-800/80 text-xs text-slate-300 space-y-2 bg-slate-900/30 leading-relaxed">
                      <p>
                        <strong>Cause:</strong> The file on your machine is 0 bytes or an HTML error page because <code className="text-slate-200">curl localhost:3000</code> was run on your Chromebook where no server was active.
                      </p>
                      <p>
                        <strong>Fix:</strong> Delete the empty file, click the green <strong>"Download .deb"</strong> button above, and install it via the ChromeOS Files app (Method 1) or drag it into Linux files:
                      </p>
                      <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300">
{`# 1. Remove the empty file:
rm -f ~/remix-evo_0.2.0_amd64.deb

# 2. Check the size of the newly downloaded file (must be ~45M):
ls -lh ~/remix-evo_0.2.0_amd64.deb

# 3. Install cleanly:
sudo apt install ~/remix-evo_0.2.0_amd64.deb`}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Accordion 2: Command not found */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                  <button
                    onClick={() => toggleTroubleshoot('command-not-found')}
                    className="w-full flex items-center justify-between p-3.5 text-left text-xs font-mono font-bold text-slate-200 hover:text-white hover:bg-slate-900/50 cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      Error: "remix-evo: command not found" after installation
                    </span>
                    {openTroubleshootItem === 'command-not-found' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {openTroubleshootItem === 'command-not-found' && (
                    <div className="p-4 border-t border-slate-800/80 text-xs text-slate-300 space-y-2 bg-slate-900/30 leading-relaxed">
                      <p>
                        <strong>Cause:</strong> In Debian/Chromebook, <code className="text-slate-200">dpkg -i</code> does not configure packages if system dependencies are pending, or your terminal has cached old PATH lookups.
                      </p>
                      <p>
                        <strong>Fix:</strong> Run apt fix-broken and refresh your shell hash:
                      </p>
                      <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-300">
{`sudo apt-get install -f
hash -r
remix-evo start`}
                      </pre>
                      <p>Or invoke the binary path directly:</p>
                      <pre className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
/opt/remix-evo/bin/remix-evo start
                      </pre>
                    </div>
                  )}
                </div>

                {/* Accordion 3: Running diagnostics with remix-evo doctor */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                  <button
                    onClick={() => toggleTroubleshoot('doctor')}
                    className="w-full flex items-center justify-between p-3.5 text-left text-xs font-mono font-bold text-slate-200 hover:text-white hover:bg-slate-900/50 cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2 text-emerald-400">
                      <Stethoscope className="w-4 h-4" />
                      System Health & Diagnostics: remix-evo doctor
                    </span>
                    {openTroubleshootItem === 'doctor' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {openTroubleshootItem === 'doctor' && (
                    <div className="p-4 border-t border-slate-800/80 text-xs text-slate-300 space-y-2 bg-slate-900/30 leading-relaxed">
                      <p>
                        To verify that the bundled Node.js runtime, permissions, configuration, and background daemon are healthy, run:
                      </p>
                      <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300">
remix-evo doctor
                      </pre>
                      <p className="text-slate-400 text-[11px]">
                        This outputs your active port, PID status, Node version, and GEMINI_API_KEY configuration status.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Remix Evo Matrix v0.2.0 &bull; Native Hardware Execution</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
