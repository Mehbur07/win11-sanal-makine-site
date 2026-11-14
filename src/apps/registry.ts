import {
  Calculator,
  FileText,
  Folder,
  Globe,
  Image,
  Info,
  Palette,
  Settings,
  SquareTerminal,
} from 'lucide-react';
import { About } from './about/About.tsx';
import { ComingSoon } from './coming-soon/ComingSoon.tsx';
import type { AppDefinition, AppId } from './types.ts';

// Tüm uygulamaların listesi. Yeni uygulama eklemek için buraya bir satır ekle.
// Henüz yazılmamış olanlar "yakında" penceresi açar (comingInPhase).
export const APPS: Record<AppId, AppDefinition> = {
  about: {
    id: 'about',
    titleKey: 'app.about',
    icon: Info,
    color: '#2DE2F5',
    size: { w: 520, h: 560 },
    single: true,
    component: About,
  },
  files: {
    id: 'files',
    titleKey: 'app.files',
    icon: Folder,
    color: '#FFC25A',
    size: { w: 760, h: 500 },
    component: ComingSoon,
    comingInPhase: 3,
  },
  editor: {
    id: 'editor',
    titleKey: 'app.editor',
    icon: FileText,
    color: '#8AF3FF',
    size: { w: 680, h: 480 },
    component: ComingSoon,
    comingInPhase: 4,
  },
  calculator: {
    id: 'calculator',
    titleKey: 'app.calculator',
    icon: Calculator,
    color: '#FF2DAA',
    size: { w: 340, h: 500 },
    single: true,
    component: ComingSoon,
    comingInPhase: 4,
  },
  paint: {
    id: 'paint',
    titleKey: 'app.paint',
    icon: Palette,
    color: '#FF7AD0',
    size: { w: 760, h: 540 },
    component: ComingSoon,
    comingInPhase: 4,
  },
  photos: {
    id: 'photos',
    titleKey: 'app.photos',
    icon: Image,
    color: '#7CF5B4',
    size: { w: 720, h: 520 },
    single: true,
    component: ComingSoon,
    comingInPhase: 4,
  },
  terminal: {
    id: 'terminal',
    titleKey: 'app.terminal',
    icon: SquareTerminal,
    color: '#7CF5B4',
    size: { w: 640, h: 400 },
    component: ComingSoon,
    comingInPhase: 4,
  },
  browser: {
    id: 'browser',
    titleKey: 'app.browser',
    icon: Globe,
    color: '#2DE2F5',
    size: { w: 900, h: 600 },
    component: ComingSoon,
    comingInPhase: 4,
  },
  settings: {
    id: 'settings',
    titleKey: 'app.settings',
    icon: Settings,
    color: '#8FA9B0',
    size: { w: 760, h: 540 },
    single: true,
    component: ComingSoon,
    comingInPhase: 4,
  },
  mehburmc: {
    id: 'mehburmc',
    titleKey: 'app.mehburmc',
    icon: { src: '/brand/mehburmc-128.webp' },
    color: '#2DE2F5',
    size: { w: 900, h: 580 },
    single: true,
    component: ComingSoon,
    comingInPhase: 5,
  },
};

export const ALL_APP_IDS = Object.keys(APPS) as AppId[];

// Panelde sabit duran uygulamalar
export const PINNED_APPS: AppId[] = ['files', 'browser', 'editor', 'terminal', 'mehburmc'];

// Bilgisayar ve tablette masaüstünde görünen simgeler (telefonda tüm uygulamalar görünür)
export const DESKTOP_APPS: AppId[] = ['about', 'files', 'mehburmc', 'settings'];
