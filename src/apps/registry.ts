import {
  Calculator as CalculatorIcon,
  FileText,
  Folder,
  Globe,
  Image,
  Info,
  Palette,
  Settings as SettingsIcon,
  SquareTerminal,
} from 'lucide-react';
import { lazy, type ComponentType } from 'react';
import type { AppDefinition, AppId, AppProps } from './types.ts';

// Uygulamalar ihtiyaç anında yüklenir (code splitting): açılışta yalnızca masaüstü indirilir,
// bir uygulamanın kodu ilk kez açıldığında gelir. Böylece site daha hızlı açılır.
function load(importer: () => Promise<ComponentType<AppProps>>) {
  return lazy(async () => ({ default: await importer() }));
}

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
    component: load(() => import('./about/About.tsx').then((m) => m.About)),
  },
  files: {
    id: 'files',
    titleKey: 'app.files',
    icon: Folder,
    color: '#FFC25A',
    size: { w: 860, h: 540 },
    component: load(() => import('./files/Files.tsx').then((m) => m.Files)),
  },
  editor: {
    id: 'editor',
    titleKey: 'app.editor',
    icon: FileText,
    color: '#8AF3FF',
    size: { w: 680, h: 480 },
    component: load(() => import('./editor/Editor.tsx').then((m) => m.Editor)),
  },
  calculator: {
    id: 'calculator',
    titleKey: 'app.calculator',
    icon: CalculatorIcon,
    color: '#FF2DAA',
    size: { w: 340, h: 500 },
    single: true,
    component: load(() => import('./calculator/Calculator.tsx').then((m) => m.Calculator)),
  },
  paint: {
    id: 'paint',
    titleKey: 'app.paint',
    icon: Palette,
    color: '#FF7AD0',
    size: { w: 760, h: 540 },
    component: load(() => import('./paint/Paint.tsx').then((m) => m.Paint)),
  },
  photos: {
    id: 'photos',
    titleKey: 'app.photos',
    icon: Image,
    color: '#7CF5B4',
    size: { w: 720, h: 520 },
    single: true,
    component: load(() => import('./photos/Photos.tsx').then((m) => m.Photos)),
  },
  terminal: {
    id: 'terminal',
    titleKey: 'app.terminal',
    icon: SquareTerminal,
    color: '#7CF5B4',
    size: { w: 640, h: 400 },
    component: load(() => import('./terminal/Terminal.tsx').then((m) => m.Terminal)),
  },
  browser: {
    id: 'browser',
    titleKey: 'app.browser',
    icon: Globe,
    color: '#2DE2F5',
    size: { w: 900, h: 600 },
    component: load(() => import('./browser/Browser.tsx').then((m) => m.Browser)),
  },
  settings: {
    id: 'settings',
    titleKey: 'app.settings',
    icon: SettingsIcon,
    color: '#8FA9B0',
    size: { w: 760, h: 540 },
    single: true,
    component: load(() => import('./settings/Settings.tsx').then((m) => m.Settings)),
  },
  mehburmc: {
    id: 'mehburmc',
    titleKey: 'app.mehburmc',
    icon: { src: '/brand/mehburmc-128.webp' },
    color: '#2DE2F5',
    size: { w: 900, h: 580 },
    single: true,
    component: load(() => import('./launcher/Launcher.tsx').then((m) => m.Launcher)),
  },
};

export const ALL_APP_IDS = Object.keys(APPS) as AppId[];

// Panelde sabit duran uygulamalar
export const PINNED_APPS: AppId[] = ['files', 'browser', 'editor', 'terminal', 'mehburmc'];

// Bilgisayar ve tablette masaüstünde görünen simgeler (telefonda tüm uygulamalar görünür)
export const DESKTOP_APPS: AppId[] = ['about', 'files', 'mehburmc', 'settings'];
