import { useCallback, useState } from 'react';
import { BootScreen } from './shell/BootScreen.tsx';
import { Desktop } from './shell/Desktop.tsx';

type Stage = 'boot' | 'desktop';

// Uygulamanın en üst katmanı: önce açılış animasyonu, sonra masaüstü
export function App() {
  const [stage, setStage] = useState<Stage>('boot');
  const finishBoot = useCallback(() => setStage('desktop'), []);

  return stage === 'boot' ? <BootScreen onDone={finishBoot} /> : <Desktop />;
}
