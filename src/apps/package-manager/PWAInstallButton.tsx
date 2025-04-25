import React, { useEffect, useState } from 'react';

export const PWAInstallButton: React.FC<{ app: { url: string } }> = ({ app }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Only show install if the origin matches the app's url
      if (e.prompt && app.url.startsWith(window.location.origin)) {
        setDeferredPrompt(e);
        setShow(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [app.url]);

  if (!show || !deferredPrompt) return null;

  return (
    <button
      className="pm-btn pm-btn-install"
      onClick={async () => {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setShow(false);
      }}
      style={{ marginLeft: 8 }}
    >
      Install as App
    </button>
  );
};
