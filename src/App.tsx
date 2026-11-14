import { useCallback, useState } from 'react';
import { BootScreen } from './shell/BootScreen.tsx';
import { Desktop } from './shell/Desktop.tsx';

type Stage = 'boot' | 'desktop';

// Uygulamanın en üst katmanı: önce açılış animasyonu, sonra masaüstü.
// "Yeniden başlat" açılış ekranına döner; masaüstü (açık pencereler dahil) sıfırlanır.
export function App() {
  const [stage, setStage] = useState<Stage>('boot');
  const finishBoot = useCallback(() => setStage('desktop'), []);
  const restart = useCallback(() => setStage('boot'), []);

  return stage === 'boot' ? <BootScreen onDone={finishBoot} /> : <Desktop onRestart={restart} />;
}
