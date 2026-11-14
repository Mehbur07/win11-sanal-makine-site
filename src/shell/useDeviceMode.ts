import { useEffect, useState } from 'react';
import { detectMode, type DeviceMode } from './device.ts';

const COARSE_QUERY = '(pointer: coarse)';

function currentMode(): DeviceMode {
  const coarse = window.matchMedia?.(COARSE_QUERY).matches ?? false;
  return detectMode(window.innerWidth, window.innerHeight, coarse);
}

// Ekran döndürülünce veya pencere boyutu değişince modu günceller
export function useDeviceMode(): DeviceMode {
  const [mode, setMode] = useState<DeviceMode>(currentMode);

  useEffect(() => {
    const update = () => setMode(currentMode());
    window.addEventListener('resize', update);
    const media = window.matchMedia?.(COARSE_QUERY);
    media?.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      media?.removeEventListener?.('change', update);
    };
  }, []);

  return mode;
}
