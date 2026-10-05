import React, { useState } from 'react';
import { Laptop, Download, CheckCircle2, HardDrive, ArrowDownToLine } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { LaptopInstallModal } from './LaptopInstallModal';
import { triggerDownload } from '../utils/downloadHelper';

interface LaptopInstallButtonProps {
  className?: string;
  compact?: boolean;
}

export const LaptopInstallButton: React.FC<LaptopInstallButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const { isInstallable, isInstalled } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<'cros' | 'pwa' | 'windows' | 'mac' | 'troubleshoot'>('cros');
  const [downloading, setDownloading] = useState(false);

  const handleDebDownload = async () => {
    setDownloading(true);
    await triggerDownload('/api/download/deb', 'remix-evo_0.2.0_amd64.deb');
    setDownloading(false);
  };

  return (
    <>
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Direct .deb Download Button */}
        <button
          onClick={handleDebDownload}
          disabled={downloading}
          title="Direct Download: Linux / Chromebook .deb package (45 MB)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/50 hover:border-emerald-400 text-emerald-300 shadow-sm cursor-pointer disabled:opacity-60"
        >
          <ArrowDownToLine className={`w-3.5 h-3.5 text-emerald-400 ${downloading ? 'animate-spin' : 'animate-bounce'}`} />
          <span>{downloading ? 'Downloading...' : 'Download .deb'}</span>
          <span className="text-[10px] text-emerald-400/80 bg-emerald-900/60 px-1 rounded">45MB</span>
        </button>

        {/* Laptop Installation Hub Button */}
        <button
          onClick={() => {
            setInitialTab('cros');
            setModalOpen(true);
          }}
          className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer shadow-sm ${
            isInstalled
              ? 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              : 'bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-purple-500/50 text-purple-200 hover:border-purple-400 hover:from-purple-800/70 hover:to-indigo-800/70'
          }`}
          title="Open Laptop & Desktop Installation Guide"
        >
          {isInstalled ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Laptop className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
          )}

          <span className="font-medium">
            {compact ? 'Install' : 'Install on Laptop'}
          </span>
        </button>
      </div>

      <LaptopInstallModal
        isOpen={modalOpen}
        initialTab={initialTab}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};
