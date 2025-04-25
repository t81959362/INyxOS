import React, { useEffect, useRef } from 'react';

const PPSSPPApp: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/games/ppsspp/ppsspp.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const PSP = (window as any).PPSSPP;
      if (PSP && containerRef.current) {
        PSP.init({
          canvasContainer: containerRef.current,
        });
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default PPSSPPApp;
