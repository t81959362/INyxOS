import React, { useRef, useEffect } from 'react';

interface GPUCanvasProps {
  width: number;
  height: number;
  style?: React.CSSProperties;
}

const GPUCanvas: React.FC<GPUCanvasProps> = ({ width, height, style }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const init = async () => {
      const nav = navigator as any;
      if (!nav.gpu) {
        console.warn('WebGPU not supported');
        return;
      }
      const adapter = await nav.gpu.requestAdapter();
      if (!adapter) {
        console.warn('Failed to get GPU adapter');
        return;
      }
      const device = await adapter.requestDevice();
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('webgpu') as any;
        const format = nav.gpu.getPreferredCanvasFormat();
        context.configure({
          device,
          format,
          alphaMode: 'premultiplied',
        });
        const render = () => {
          const encoder = device.createCommandEncoder();
          const textureView = context.getCurrentTexture().createView();
          const pass = encoder.beginRenderPass({
            colorAttachments: [{
              view: textureView,
              clearValue: { r: 0, g: 0, b: 0, a: 0 },
              loadOp: 'clear',
              storeOp: 'store',
            }],
          });
          pass.end();
          device.queue.submit([encoder.finish()]);
        };
        render();
      }
    };
    init();
  }, []);

  return <canvas ref={canvasRef} width={width} height={height} style={style} />;
};

export default GPUCanvas;
