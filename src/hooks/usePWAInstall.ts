import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type DetectedOS = 'mac' | 'windows' | 'linux' | 'chromeos' | 'ios' | 'android' | 'unknown';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [os, setOs] = useState<DetectedOS>('unknown');

  useEffect(() => {
    // Detect standalone mode (already installed as desktop or mobile app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect operating system
    const ua = window.navigator.userAgent.toLowerCase();
    const platform = (window.navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform?.toLowerCase() || '';

    if (/iphone|ipad|ipod/.test(ua)) {
      setIsIOS(true);
      setOs('ios');
    } else if (/cros/.test(ua)) {
      setOs('chromeos');
    } else if (/macintosh|mac os x/.test(ua) || platform.includes('mac')) {
      setOs('mac');
    } else if (/windows|win32|win64/.test(ua) || platform.includes('win')) {
      setOs('windows');
    } else if (/android/.test(ua)) {
      setOs('android');
    } else if (/linux/.test(ua) || platform.includes('linux')) {
      setOs('linux');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error('Install prompt failed:', err);
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    os,
    install,
    deferredPrompt,
  };
}
