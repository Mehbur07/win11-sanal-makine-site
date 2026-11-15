import {
  Circle,
  Eraser,
  FilePlus,
  FolderOpen,
  Minus,
  PaintBucket,
  Pencil,
  Redo2,
  Save,
  SaveAll,
  Square,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import { useI18n } from '../../i18n/context.ts';
import type { MessageKey } from '../../i18n/messages.ts';
import { useWM } from '../../shell/wm/context.ts';
import { useStorage } from '../../storage/context.ts';
import { baseName, parentOf } from '../../storage/names.ts';
import type { Path, StorageBackend } from '../../storage/types.ts';
import { WithBackend } from '../../storage/WithBackend.tsx';
import { fileType } from '../files/fileTypes.ts';
import { FileDialog } from '../shared/FileDialog.tsx';
import type { AppProps } from '../types.ts';
import { floodFill, hexToRgba } from './floodFill.ts';
import '../shared/AppToolbar.css';
import './Paint.css';

type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'fill';

const TOOLS: { id: Tool; icon: LucideIcon; key: MessageKey }[] = [
  { id: 'pen', icon: Pencil, key: 'paint.pen' },
  { id: 'eraser', icon: Eraser, key: 'paint.eraser' },
  { id: 'line', icon: Minus, key: 'paint.line' },
  { id: 'rect', icon: Square, key: 'paint.rect' },
  { id: 'ellipse', icon: Circle, key: 'paint.ellipse' },
  { id: 'fill', icon: PaintBucket, key: 'paint.fill' },
];

const PALETTE = [
  '#000000',
  '#ffffff',
  '#8fa9b0',
  '#2de2f5',
  '#3cf59a',
  '#ffc25a',
  '#ff7a3c',
  '#ff2daa',
  '#9b5cff',
  '#1f6feb',
  '#8b4513',
  '#e81c4f',
];

const W = 1280;
const H = 800;
const MAX_UNDO = 25;
const acceptImage = (name: string) => fileType(name, 'file') === 'image';

export function Paint(props: AppProps) {
  return <WithBackend>{(backend) => <PaintBody {...props} backend={backend} />}</WithBackend>;
}

function PaintBody({ windowId, args, backend }: AppProps & { backend: StorageBackend }) {
  const { t } = useI18n();
  const wm = useWM();
  const storage = useStorage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#2de2f5');
  const [size, setSize] = useState(6);
  const [path, setPath] = useState<Path | null>(args?.path ?? null);
  const [dirty, setDirty] = useState(false);
  const [dialog, setDialog] = useState<'open' | 'save' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const undo = useRef<ImageData[]>([]);
  const redo = useRef<ImageData[]>([]);
  const [counts, setCounts] = useState({ undo: 0, redo: 0 });
  const [dims, setDims] = useState({ w: W, h: H });
  const drawing = useRef<{ x: number; y: number } | null>(null);
  const syncCounts = () => setCounts({ undo: undo.current.length, redo: redo.current.length });

  const ctx = () => canvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null;

  function clearCanvas(width = W, height = H) {
    const canvas = canvasRef.current;
    const preview = previewRef.current;
    const c = ctx();
    if (!canvas || !preview || !c) return;
    canvas.width = preview.width = width;
    canvas.height = preview.height = height;
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, width, height);
  }

  async function loadImage(target: Path) {
    const blob = await backend.read(target);
    const bitmap = await createImageBitmap(blob);
    // Çok büyük resimler en fazla 2400 px olacak şekilde küçültülür
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    clearCanvas(w, h);
    setDims({ w, h });
    ctx()?.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    undo.current = [];
    redo.current = [];
    syncCounts();
    setPath(target);
    setDirty(false);
  }

  // Açılışta: dosya verildiyse onu yükle, yoksa boş beyaz tuval
  const initialPath = args?.path?.join('/');
  useEffect(() => {
    clearCanvas();
    if (initialPath) {
      // loadImage durumu yalnızca dosya okunduktan sonra (await sonrası) değiştirir
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadImage(initialPath.split('/')).catch((e) =>
        setMessage(t('files.err.generic', { message: String(e) })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca açılışta
  }, []);

  useEffect(() => {
    wm.setTitle(windowId, path ? baseName(path) : t('paint.untitled'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowId, path, t]);
  useEffect(() => {
    wm.setDirty(windowId, dirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowId, dirty]);

  function pushUndo() {
    const c = ctx();
    const canvas = canvasRef.current;
    if (!c || !canvas) return;
    undo.current.push(c.getImageData(0, 0, canvas.width, canvas.height));
    if (undo.current.length > MAX_UNDO) undo.current.shift();
    redo.current = [];
    setDirty(true);
    syncCounts();
  }

  const undoStep = () => step(undo, redo);
  const redoStep = () => step(redo, undo);

  function step(from: RefObject<ImageData[]>, to: RefObject<ImageData[]>) {
    const c = ctx();
    const canvas = canvasRef.current;
    const image = from.current.pop();
    if (!c || !canvas || !image) return;
    to.current.push(c.getImageData(0, 0, canvas.width, canvas.height));
    if (image.width !== canvas.width || image.height !== canvas.height) {
      canvas.width = previewRef.current!.width = image.width;
      canvas.height = previewRef.current!.height = image.height;
      setDims({ w: image.width, h: image.height });
    }
    c.putImageData(image, 0, 0);
    setDirty(true);
    syncCounts();
  }

  /** Ekrandaki imleç konumu → tuval pikseli (tuval küçültülmüş gösterilebilir) */
  function point(e: PointerEvent) {
    const canvas = canvasRef.current!;
    const box = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - box.left) * canvas.width) / box.width,
      y: ((e.clientY - box.top) * canvas.height) / box.height,
    };
  }

  function strokeStyle(c: CanvasRenderingContext2D) {
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.lineWidth = tool === 'eraser' ? size * 3 : size;
    c.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
  }

  function drawShape(
    c: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) {
    strokeStyle(c);
    c.beginPath();
    if (tool === 'line') {
      c.moveTo(from.x, from.y);
      c.lineTo(to.x, to.y);
    } else if (tool === 'rect') {
      c.rect(from.x, from.y, to.x - from.x, to.y - from.y);
    } else if (tool === 'ellipse') {
      c.ellipse(
        (from.x + to.x) / 2,
        (from.y + to.y) / 2,
        Math.abs(to.x - from.x) / 2,
        Math.abs(to.y - from.y) / 2,
        0,
        0,
        Math.PI * 2,
      );
    }
    c.stroke();
  }

  function onDown(e: PointerEvent<HTMLCanvasElement>) {
    if (e.button !== 0) return;
    const c = ctx();
    const canvas = canvasRef.current;
    if (!c || !canvas) return;
    const p = point(e);
    pushUndo();
    if (tool === 'fill') {
      const image = c.getImageData(0, 0, canvas.width, canvas.height);
      if (floodFill(image, Math.floor(p.x), Math.floor(p.y), hexToRgba(color))) {
        c.putImageData(image, 0, 0);
      }
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = p;
    if (tool === 'pen' || tool === 'eraser') {
      strokeStyle(c);
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + 0.01, p.y);
      c.stroke();
    }
  }

  function onMove(e: PointerEvent<HTMLCanvasElement>) {
    const start = drawing.current;
    const c = ctx();
    if (!start || !c) return;
    const p = point(e);
    if (tool === 'pen' || tool === 'eraser') {
      strokeStyle(c);
      c.beginPath();
      c.moveTo(start.x, start.y);
      c.lineTo(p.x, p.y);
      c.stroke();
      drawing.current = p;
    } else {
      // Şekil çizerken önizleme ayrı, şeffaf bir tuvalde
      const pc = previewRef.current?.getContext('2d');
      if (!pc) return;
      pc.clearRect(0, 0, pc.canvas.width, pc.canvas.height);
      drawShape(pc, start, p);
    }
  }

  function onUp(e: PointerEvent<HTMLCanvasElement>) {
    const start = drawing.current;
    drawing.current = null;
    const c = ctx();
    if (!start || !c) return;
    if (tool !== 'pen' && tool !== 'eraser') {
      previewRef.current?.getContext('2d')?.clearRect(0, 0, W * 4, H * 4);
      drawShape(c, start, point(e));
    }
  }

  async function saveTo(target: Path) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    try {
      await backend.write(target, blob);
      setPath(target);
      setDirty(false);
      setMessage(t('editor.saved', { name: baseName(target) }));
      storage.changed();
    } catch (e) {
      setMessage(t('files.err.generic', { message: e instanceof Error ? e.message : String(e) }));
    }
  }

  // PNG dışı bir resim açıldıysa kaydederken .png uzantısına geçilir
  const pngName = (name: string) =>
    name.toLowerCase().endsWith('.png') ? name : `${name.replace(/\.[^.]+$/, '')}.png`;
  const save = () =>
    path && path[path.length - 1]?.toLowerCase().endsWith('.png')
      ? saveTo(path)
      : setDialog('save');

  function onKeyDown(e: KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === 'z') undoStep();
    else if (key === 'y') redoStep();
    else if (key === 's') save();
    else return;
    e.preventDefault();
  }

  return (
    <div className="paint" onKeyDown={onKeyDown} tabIndex={-1}>
      <div className="app-toolbar" role="toolbar" aria-label={t('paint.toolbar')}>
        <ToolBtn label={t('editor.new')} icon={FilePlus} onClick={() => wm.open('paint')} />
        <ToolBtn label={t('dialog.open')} icon={FolderOpen} onClick={() => setDialog('open')} />
        <ToolBtn label={t('files.save')} icon={Save} onClick={save} />
        <ToolBtn label={t('dialog.saveAs')} icon={SaveAll} onClick={() => setDialog('save')} />
        <span className="app-toolbar__sep" />
        <ToolBtn
          label={t('paint.undo')}
          icon={Undo2}
          onClick={undoStep}
          disabled={counts.undo === 0}
        />
        <ToolBtn
          label={t('paint.redo')}
          icon={Redo2}
          onClick={redoStep}
          disabled={counts.redo === 0}
        />
        <span className="app-toolbar__sep" />
        {TOOLS.map(({ id, icon, key }) => (
          <ToolBtn
            key={id}
            label={t(key)}
            icon={icon}
            onClick={() => setTool(id)}
            pressed={tool === id}
          />
        ))}
        <span className="app-toolbar__sep" />
        <label className="paint__size" title={t('paint.size')}>
          <span className="visually-hidden">{t('paint.size')}</span>
          <input
            type="range"
            min={1}
            max={40}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
          <span>{size}</span>
        </label>
      </div>

      <div className="paint__palette" role="radiogroup" aria-label={t('paint.color')}>
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={color === c}
            aria-label={c}
            className="paint__swatch"
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
        <label className="paint__custom" title={t('paint.customColor')}>
          <span className="visually-hidden">{t('paint.customColor')}</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
      </div>

      <div className="paint__stage">
        <div className="paint__canvas-wrap">
          <canvas
            ref={canvasRef}
            className="paint__canvas"
            data-tool={tool}
            data-testid="paint-canvas"
            aria-label={t('paint.canvas')}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
          <canvas ref={previewRef} className="paint__preview" aria-hidden="true" />
        </div>
      </div>

      <footer className="app-status">
        <span>
          {dims.w} × {dims.h}
        </span>
        <span className="app-status__msg" role="status">
          {message}
        </span>
      </footer>

      {dialog && (
        <FileDialog
          mode={dialog}
          backend={backend}
          startDir={path ? parentOf(path) : ['Resimler']}
          defaultName={pngName(path ? baseName(path) : t('paint.defaultName'))}
          accept={acceptImage}
          onCancel={() => setDialog(null)}
          onPick={(target) => {
            setDialog(null);
            if (dialog === 'save') {
              const name = pngName(baseName(target));
              saveTo([...parentOf(target), name]);
            } else if (dirty) {
              wm.open('paint', { path: target });
            } else {
              loadImage(target).catch((e) => setMessage(String(e)));
            }
          }}
        />
      )}
    </div>
  );
}

function ToolBtn({
  label,
  icon: Icon,
  onClick,
  pressed,
  disabled,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="tool"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
