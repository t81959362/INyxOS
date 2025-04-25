import React, { useRef, useEffect } from 'react';

// Stub for LibreOffice WASM integration
const LibreOfficeApp: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load LibreOffice WASM loader script
    const script = document.createElement('script');
    script.src = '/libreoffice-wasm/loader.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const LO = (window as any).LibreOfficeWasm;
      if (LO && containerRef.current) {
        LO.init({
          container: containerRef.current,
          wasmBinaryUrl: '/libreoffice-wasm/libreoffice.wasm',
        });
      }
    };
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#1e222b' }} />;
};

export default LibreOfficeApp;
