import React, { useEffect, useState } from 'react';

export const SystemMonitorWidget: React.FC = () => {
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);

  useEffect(() => {
    let batteryObj: any = null;
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        batteryObj = b;
        setBattery({ level: b.level, charging: b.charging });
        b.addEventListener('levelchange', () => setBattery({ level: b.level, charging: b.charging }));
        b.addEventListener('chargingchange', () => setBattery({ level: b.level, charging: b.charging }));
      });
    }
    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', () => {});
        batteryObj.removeEventListener('chargingchange', () => {});
      }
    };
  }, []);

  const cpuCores = navigator.hardwareConcurrency || 'N/A';
  const deviceMemory = (navigator as any).deviceMemory || 'N/A';

  return (
    <div style={{ padding: 16, minWidth: 200 }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>📊 System Monitor</div>
      <div style={{ fontSize: 15, color: '#fff', marginBottom: 8 }}>
        <div><b>CPU Cores:</b> {cpuCores}</div>
        <div><b>Device Memory:</b> {deviceMemory} GB</div>
        <div>
          <b>Battery:</b> {battery ? `${Math.round(battery.level * 100)}% ${battery.charging ? '(Charging)' : ''}` : 'N/A'}
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#bfa', marginTop: 8 }}>Live hardware info (browser-limited)</div>
    </div>
  );
};
