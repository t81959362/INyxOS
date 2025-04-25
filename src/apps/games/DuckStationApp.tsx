import React, { useEffect, useRef } from 'react';

const DuckStationApp: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load DuckStation WASM/Emscripten build
    const script = document.createElement('script');
    script.src = '/games/duckstation/duckstation.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const DS = (window as any).DuckStation;
      if (DS && containerRef.current) {
        DS.init({
          canvasContainer: containerRef.current,
        });
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  );
};

export default DuckStationApp;
