import type { AppArgs, AppId } from '../../apps/types.ts';
import type { Rect, Snap } from './geometry.ts';

// Pencere yöneticisinin durumu. "reducer": mevcut durum + bir eylem → yeni durum.
// Ekrana çizimden bağımsız olduğu için birim testlerle denetlenir.

export interface WinState {
  id: string;
  appId: AppId;
  /** Serbest durumdaki konum/boyut (yaslıyken de saklanır, geri dönünce kullanılır) */
  rect: Rect;
  snap: Snap;
  minimized: boolean;
  /** Üst üste binme sırası; büyük olan üstte */
  z: number;
  /** Açılış bilgileri (ör. dosya yolu) */
  args?: AppArgs;
  /** Uygulamanın verdiği başlık (ör. dosya adı); yoksa uygulama adı */
  title?: string;
  /** Kaydedilmemiş değişiklik var mı (kapatırken sorulur) */
  dirty?: boolean;
  /** Kapatma onayı bekleniyor */
  confirmClose?: boolean;
}

export interface WMState {
  windows: WinState[];
  nextId: number;
  zTop: number;
}

export const initialWM: WMState = { windows: [], nextId: 1, zTop: 0 };

export type WMAction =
  | { type: 'open'; appId: AppId; rect: Rect; single?: boolean; args?: AppArgs }
  | { type: 'close'; id: string }
  /** Kaydedilmemiş değişiklik varsa önce sorar, yoksa kapatır */
  | { type: 'requestClose'; id: string }
  | { type: 'cancelClose'; id: string }
  | { type: 'setTitle'; id: string; title: string | undefined }
  | { type: 'setDirty'; id: string; dirty: boolean }
  | { type: 'focus'; id: string }
  | { type: 'minimize'; id: string }
  | { type: 'restore'; id: string }
  | { type: 'toggleMax'; id: string }
  | { type: 'snap'; id: string; snap: Snap }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'setRect'; id: string; rect: Rect }
  | { type: 'minimizeAll' };

/** Odaktaki pencere: küçültülmemiş olanlar arasında en üstteki */
export function focusedWindow(state: WMState): WinState | undefined {
  let top: WinState | undefined;
  for (const w of state.windows) {
    if (!w.minimized && (!top || w.z > top.z)) top = w;
  }
  return top;
}

function update(state: WMState, id: string, change: (w: WinState) => Partial<WinState>): WMState {
  if (!state.windows.some((w) => w.id === id)) return state;
  return {
    ...state,
    windows: state.windows.map((w) => (w.id === id ? { ...w, ...change(w) } : w)),
  };
}

/** Pencereyi en üste çıkarır (ve gerekirse küçültülmüş hâlden geri getirir) */
function raise(state: WMState, id: string, extra: (w: WinState) => Partial<WinState> = () => ({})) {
  const zTop = state.zTop + 1;
  const next = update(state, id, (w) => ({ z: zTop, minimized: false, ...extra(w) }));
  return next === state ? state : { ...next, zTop };
}

export function wmReducer(state: WMState, action: WMAction): WMState {
  switch (action.type) {
    case 'open': {
      const key = action.args?.path?.join('/');
      // Aynı dosya zaten açıksa o pencere öne gelir
      if (key !== undefined) {
        const same = state.windows.find(
          (w) => w.appId === action.appId && w.args?.path?.join('/') === key,
        );
        if (same) return raise(state, same.id);
      }
      if (action.single) {
        const existing = state.windows.find((w) => w.appId === action.appId);
        if (existing) {
          return raise(state, existing.id, () => (action.args ? { args: action.args } : {}));
        }
      }
      const zTop = state.zTop + 1;
      const win: WinState = {
        id: `w${state.nextId}`,
        appId: action.appId,
        rect: action.rect,
        snap: null,
        minimized: false,
        z: zTop,
        args: action.args,
      };
      return { windows: [...state.windows, win], nextId: state.nextId + 1, zTop };
    }
    case 'close':
      return { ...state, windows: state.windows.filter((w) => w.id !== action.id) };
    case 'requestClose': {
      const win = state.windows.find((w) => w.id === action.id);
      if (!win) return state;
      if (!win.dirty) return wmReducer(state, { type: 'close', id: action.id });
      return raise(state, action.id, () => ({ confirmClose: true }));
    }
    case 'cancelClose':
      return update(state, action.id, () => ({ confirmClose: false }));
    case 'setTitle':
      return update(state, action.id, () => ({ title: action.title }));
    case 'setDirty':
      return update(state, action.id, () => ({ dirty: action.dirty }));
    case 'focus': {
      const win = state.windows.find((w) => w.id === action.id);
      if (!win || (!win.minimized && win.z === state.zTop)) return state;
      return raise(state, action.id);
    }
    case 'restore':
      return raise(state, action.id);
    case 'minimize':
      return update(state, action.id, () => ({ minimized: true }));
    case 'toggleMax':
      return raise(state, action.id, (w) => ({ snap: w.snap === 'max' ? null : 'max' }));
    case 'snap':
      return raise(state, action.id, () => ({ snap: action.snap }));
    case 'move':
      return update(state, action.id, (w) => ({ rect: { ...w.rect, x: action.x, y: action.y } }));
    case 'setRect':
      return update(state, action.id, () => ({ rect: action.rect, snap: null }));
    case 'minimizeAll':
      return { ...state, windows: state.windows.map((w) => ({ ...w, minimized: true })) };
  }
}
