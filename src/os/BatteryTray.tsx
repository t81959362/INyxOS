import React from 'react';

const useBattery = () => {
  const [battery, setBattery] = React.useState<any>(null);
  React.useEffect(() => {
    let mounted = true;
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        function update() {
          if (mounted) setBattery({
            level: bat.level,
            charging: bat.charging,
            chargingTime: bat.chargingTime,
            dischargingTime: bat.dischargingTime
          });
        }
        update();
        bat.addEventListener('levelchange', update);
        bat.addEventListener('chargingchange', update);
        return () => {
          bat.removeEventListener('levelchange', update);
          bat.removeEventListener('chargingchange', update);
        };
      });
    }
    return () => { mounted = false; };
  }, []);
  return battery;
};

const isLaptop = () => {
  // Heuristic: Battery API only available on laptops/mobile
  return 'getBattery' in navigator;
};

const BatteryTray: React.FC = () => {
  const battery = useBattery();
  if (!isLaptop() || !battery) return null;
  const percent = Math.round((battery.level || 0) * 100);
  return (
    <span className="tray-icon" title={`Battery: ${percent}%` + (battery.charging ? ' (Charging)' : '')}>
      <span role="img" aria-label="Battery">{battery.charging ? '🔌' : '🔋'}</span> {percent}%
    </span>
  );
};

export default BatteryTray;
