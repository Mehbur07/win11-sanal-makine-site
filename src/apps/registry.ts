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
import { About } from './about/About.tsx';
import { Browser } from './browser/Browser.tsx';
import { Calculator } from './calculator/Calculator.tsx';
import { Editor } from './editor/Editor.tsx';
import { Paint } from './paint/Paint.tsx';
import { Photos } from './photos/Photos.tsx';
import { Settings } from './settings/Settings.tsx';
import { Terminal } from './terminal/Terminal.tsx';
import { Files } from './files/Files.tsx';
import { Launcher } from './launcher/Launcher.tsx';
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
    size: { w: 860, h: 540 },
    component: Files,
  },
  editor: {
    id: 'editor',
    titleKey: 'app.editor',
    icon: FileText,
    color: '#8AF3FF',
    size: { w: 680, h: 480 },
    component: Editor,
  },
  calculator: {
    id: 'calculator',
    titleKey: 'app.calculator',
    icon: CalculatorIcon,
    color: '#FF2DAA',
    size: { w: 340, h: 500 },
    single: true,
    component: Calculator,
  },
  paint: {
    id: 'paint',
    titleKey: 'app.paint',
    icon: Palette,
    color: '#FF7AD0',
    size: { w: 760, h: 540 },
    component: Paint,
  },
  photos: {
    id: 'photos',
    titleKey: 'app.photos',
    icon: Image,
    color: '#7CF5B4',
    size: { w: 720, h: 520 },
    single: true,
    component: Photos,
  },
  terminal: {
    id: 'terminal',
    titleKey: 'app.terminal',
    icon: SquareTerminal,
    color: '#7CF5B4',
    size: { w: 640, h: 400 },
    component: Terminal,
  },
  browser: {
    id: 'browser',
    titleKey: 'app.browser',
    icon: Globe,
    color: '#2DE2F5',
    size: { w: 900, h: 600 },
    component: Browser,
  },
  settings: {
    id: 'settings',
    titleKey: 'app.settings',
    icon: SettingsIcon,
    color: '#8FA9B0',
    size: { w: 760, h: 540 },
    single: true,
    component: Settings,
  },
  mehburmc: {
    id: 'mehburmc',
    titleKey: 'app.mehburmc',
    icon: { src: '/brand/mehburmc-128.webp' },
    color: '#2DE2F5',
    size: { w: 900, h: 580 },
    single: true,
    component: Launcher,
  },
};

export const ALL_APP_IDS = Object.keys(APPS) as AppId[];

// Panelde sabit duran uygulamalar
export const PINNED_APPS: AppId[] = ['files', 'browser', 'editor', 'terminal', 'mehburmc'];

// Bilgisayar ve tablette masaüstünde görünen simgeler (telefonda tüm uygulamalar görünür)
export const DESKTOP_APPS: AppId[] = ['about', 'files', 'mehburmc', 'settings'];
