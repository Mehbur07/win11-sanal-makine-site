import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { MessageKey } from '../i18n/messages.ts';

export type AppId =
  | 'about'
  | 'files'
  | 'editor'
  | 'calculator'
  | 'paint'
  | 'photos'
  | 'terminal'
  | 'browser'
  | 'settings'
  | 'mehburmc';

// Her uygulamanın pencere içinde aldığı bilgiler
export interface AppProps {
  windowId: string;
  appId: AppId;
}

export interface AppDefinition {
  id: AppId;
  titleKey: MessageKey;
  /** Çizgi simge (lucide) ya da resim dosyası */
  icon: LucideIcon | { src: string };
  /** Simgenin neon rengi */
  color: string;
  /** Pencerenin ilk açıldığındaki boyutu */
  size: { w: number; h: number };
  /** true ise aynı anda yalnızca bir penceresi açılabilir */
  single?: boolean;
  component: ComponentType<AppProps>;
  /** Henüz yazılmadıysa hangi fazda geleceği */
  comingInPhase?: number;
}
