import { useCallback, useEffect, useState } from 'react';

// Tarayıcının tam ekran modu (adres çubuğu gizlenir). iPhone Safari desteklemez → supported: false
export function useFullscreen() {
  const supported = typeof document !== 'undefined' && !!document.fullscreenEnabled;
  const [active, setActive] = useState(() => !!document.fullscreenElement);

  useEffect(() => {
    const update = () => setActive(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  const toggle = useCallback(() => {
    if (!supported) return;
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
    request.catch(() => {
      /* kullanıcı reddederse ya da tarayıcı izin vermezse sessizce geç */
    });
  }, [supported]);

  return { supported, active, toggle };
}
