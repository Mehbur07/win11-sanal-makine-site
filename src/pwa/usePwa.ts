import { useEffect } from 'react';
import { useNotifications } from '../shell/notifications/context.ts';

// StrictMode efektleri iki kez çalıştırır; kayıt yalnızca bir kez yapılsın
let started = false;

/** Yeni sürüm olup olmadığına bakma aralığı (site uzun süre açık kalırsa) */
const UPDATE_CHECK_MS = 60 * 60 * 1000;

/**
 * Service worker'ı kaydeder (yalnızca yayınlanan sitede, geliştirme sunucusunda değil).
 * - İlk kurulumda "İnternetsiz kullanıma hazır" bildirimi
 * - Yeni sürüm indirildiğinde "Yeni sürüm hazır" bildirimi ve "Yenile" düğmesi.
 *   Kendiliğinden yenilenmez; kullanıcının açık işleri kaybolmasın diye kararı ona bırakılır.
 */
export function usePwa() {
  const { notify } = useNotifications();

  useEffect(() => {
    if (started || !import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    started = true;
    const sw = navigator.serviceWorker;
    // Sayfa açılırken zaten bir service worker varsa bu bir güncellemedir, ilk kurulum değil
    const hadController = !!sw.controller;
    let reloading = false;

    function offerUpdate(worker: ServiceWorker) {
      notify({
        titleKey: 'pwa.update.title',
        bodyKey: 'pwa.update.body',
        sticky: true,
        action: {
          labelKey: 'pwa.update.action',
          run: () => {
            sw.addEventListener('controllerchange', () => {
              if (reloading) return;
              reloading = true;
              location.reload();
            });
            worker.postMessage('skip-waiting');
          },
        },
      });
    }

    // Aynı işçi hem kayıt sonucundan hem "updatefound" olayından gelebilir; bildirim bir kez çıksın
    const watched = new WeakSet<ServiceWorker>();

    function watch(worker: ServiceWorker) {
      if (watched.has(worker)) return;
      watched.add(worker);
      worker.addEventListener('statechange', () => {
        if (worker.state !== 'installed') return;
        if (sw.controller) offerUpdate(worker);
        else notify({ titleKey: 'pwa.offlineReady.title', bodyKey: 'pwa.offlineReady.body' });
      });
    }

    sw.register('/sw.js')
      .then((reg) => {
        if (reg.waiting && hadController) offerUpdate(reg.waiting);
        if (reg.installing) watch(reg.installing);
        reg.addEventListener('updatefound', () => {
          if (reg.installing) watch(reg.installing);
        });
        window.setInterval(() => void reg.update().catch(() => undefined), UPDATE_CHECK_MS);
      })
      .catch(() => {
        // Kayıt başarısız olursa site yine normal çalışır, yalnızca internetsiz açılmaz
      });
  }, [notify]);
}
