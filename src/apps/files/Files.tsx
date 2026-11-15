import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ClipboardPaste,
  Copy,
  Download,
  FilePlus,
  FolderInput,
  FolderPlus,
  Folder,
  FolderOpen,
  Globe,
  HardDrive,
  Home,
  Image,
  LayoutGrid,
  List,
  Pencil,
  RefreshCw,
  RotateCcw,
  Scissors,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useI18n } from '../../i18n/context.ts';
import { readPref, writePref } from '../../lib/prefs.ts';
import { ConfirmDialog } from '../../shell/dialog/ConfirmDialog.tsx';
import { PromptDialog } from '../../shell/dialog/PromptDialog.tsx';
import { useWM } from '../../shell/wm/context.ts';
import { useStorage } from '../../storage/context.ts';
import {
  copyEntry,
  createFile,
  createFolder,
  deleteFromTrash,
  emptyTrash,
  importFiles,
  isHidden,
  listTrash,
  moveEntry,
  moveToTrash,
  renameEntry,
  restoreFromTrash,
  type TrashItem,
} from '../../storage/fileOps.ts';
import { HandleBackend } from '../../storage/handleBackend.ts';
import { validateName } from '../../storage/names.ts';
import { StorageChooser } from '../../storage/StorageChooser.tsx';
import { WithBackend } from '../../storage/WithBackend.tsx';
import { appForFile } from '../openWith.ts';
import { StorageError, type Entry, type Path, type StorageBackend } from '../../storage/types.ts';
import { setClip, useClip } from './clipboard.ts';
import { downloadBlob, fileType, formatDate, formatSize, TYPE_ICON } from './fileTypes.ts';
import { Preview } from './Preview.tsx';
import { Thumb } from './Thumb.tsx';
import './Files.css';

type View = { kind: 'dir'; path: Path } | { kind: 'trash' };

type Dialog =
  | { type: 'newFolder' }
  | { type: 'newFile' }
  | { type: 'rename'; name: string }
  | { type: 'confirmEmpty' }
  | { type: 'confirmPurge'; ids: string[] }
  | { type: 'preview'; path: Path }
  | { type: 'storage' }
  | null;

const LAYOUT_PREF = 'vmos:files:layout';
const LONG_PRESS_MS = 500;

const PLACES: { path: Path; icon: LucideIcon; labelKey?: 'files.home' }[] = [
  { path: [], icon: Home, labelKey: 'files.home' },
  { path: ['Belgeler'], icon: Folder },
  { path: ['Resimler'], icon: Image },
];

// Dosyalar uygulaması. Depolama hazır değilse önce yer seçtirir ya da izin ister.
export function Files() {
  return <WithBackend>{(backend) => <FileBrowser backend={backend} />}</WithBackend>;
}

function sortEntries(list: Entry[], locale: string): Entry[] {
  return [...list].sort((a, b) =>
    a.kind !== b.kind
      ? a.kind === 'dir'
        ? -1
        : 1
      : a.name.localeCompare(b.name, locale, { numeric: true, sensitivity: 'base' }),
  );
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  pressed,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      className="tool"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden="true" />
      <span className="tool__label">{label}</span>
    </button>
  );
}

function FileBrowser({ backend }: { backend: StorageBackend }) {
  const { t, locale } = useI18n();
  const storage = useStorage();
  const wm = useWM();
  const clip = useClip();
  const touchUi = wm.mode !== 'desktop';

  const [history, setHistory] = useState<{ stack: View[]; index: number }>({
    stack: [{ kind: 'dir', path: [] }],
    index: 0,
  });
  const view = history.stack[history.index] ?? { kind: 'dir', path: [] };
  const dir = view.kind === 'dir' ? view.path : null;
  const viewKey = view.kind === 'dir' ? `d:${view.path.join('/')}` : 'trash';

  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const anchor = useRef<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>(() =>
    readPref(LAYOUT_PREF) === 'list' ? 'list' : 'grid',
  );
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement | null>(null);
  const importTarget = useRef<Path>([]);
  const longPress = useRef<{ timer: number; fired: boolean } | null>(null);
  const crumbsRef = useRef<HTMLElement>(null);

  // Dar ekranda konum yolu sığmazsa en sağa (bulunulan klasöre) kaydır
  useEffect(() => {
    const el = crumbsRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [viewKey]);

  // Klasör içeriğini (ya da çöp kutusunu) yükle; dosyalar değişince (rev) yeniden yükle
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (view.kind === 'trash') {
          const items = await listTrash(backend);
          if (!cancelled) setTrash(items);
        } else {
          const list = await backend.list(view.path);
          if (!cancelled)
            setEntries(
              sortEntries(
                list.filter((e) => !isHidden(e.name)),
                locale,
              ),
            );
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof StorageError && e.code === 'notFound') {
          // Açık klasör başka yerden silindiyse ana klasöre dön
          setHistory({ stack: [{ kind: 'dir', path: [] }], index: 0 });
        } else {
          setMessage(errorText(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- view, viewKey ile temsil ediliyor
  }, [backend, viewKey, storage.rev, locale]);

  function errorText(e: unknown): string {
    if (e instanceof StorageError) {
      if (e.code === 'exists') return t('files.err.exists');
      if (e.code === 'intoItself') return t('files.err.intoItself');
      if (e.code === 'invalidName') return t('files.err.chars');
    }
    return t('files.err.generic', { message: e instanceof Error ? e.message : String(e) });
  }

  async function run(task: () => Promise<string | void>) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await task();
      if (result) setMessage(result);
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setBusy(false);
      storage.changed();
    }
  }

  function navigate(next: View) {
    setHistory((h) => ({ stack: [...h.stack.slice(0, h.index + 1), next], index: h.index + 1 }));
    setSelected([]);
    setMessage(null);
  }

  function goHistory(delta: number) {
    setHistory((h) => ({
      ...h,
      index: Math.min(Math.max(h.index + delta, 0), h.stack.length - 1),
    }));
    setSelected([]);
  }

  const goUp = () => {
    if (dir && dir.length > 0) navigate({ kind: 'dir', path: dir.slice(0, -1) });
  };

  const visibleNames =
    view.kind === 'trash' ? trash.map((i) => i.id) : (entries ?? []).map((e) => e.name);

  function open(name: string) {
    if (!dir) return;
    const entry = entries?.find((e) => e.name === name);
    if (!entry) return;
    if (entry.kind === 'dir') {
      navigate({ kind: 'dir', path: [...dir, name] });
      return;
    }
    // Metin → Metin Düzenleyici, resim → Fotoğraflar; diğerleri önizleme/indirme
    const app = appForFile(name);
    if (app) wm.open(app, { path: [...dir, name] });
    else setDialog({ type: 'preview', path: [...dir, name] });
  }

  const toggle = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));

  function onItemClick(e: MouseEvent, name: string) {
    if (longPress.current?.fired) {
      longPress.current = null;
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      toggle(name);
      anchor.current = name;
      return;
    }
    if (e.shiftKey && anchor.current) {
      const a = visibleNames.indexOf(anchor.current);
      const b = visibleNames.indexOf(name);
      if (a >= 0 && b >= 0) {
        setSelected(visibleNames.slice(Math.min(a, b), Math.max(a, b) + 1));
        return;
      }
    }
    anchor.current = name;
    if (touchUi || view.kind === 'trash') {
      // Dokunmatik: seçim yokken dokunmak açar, seçim varken seçimi değiştirir
      if (selected.length > 0 || view.kind === 'trash') toggle(name);
      else open(name);
      return;
    }
    setSelected([name]);
  }

  function startLongPress(name: string, pointerType: string) {
    if (pointerType === 'mouse') return;
    const state = { fired: false, timer: 0 };
    state.timer = window.setTimeout(() => {
      state.fired = true;
      toggle(name);
    }, LONG_PRESS_MS);
    longPress.current = state;
  }

  function cancelLongPress() {
    if (longPress.current && !longPress.current.fired) {
      window.clearTimeout(longPress.current.timer);
      longPress.current = null;
    }
  }

  // ---------- İşlemler ----------

  const selectedPaths = () => (dir ? selected.map((n) => [...dir, n]) : []);
  const selectedEntries = (entries ?? []).filter((e) => selected.includes(e.name));
  const onlyFilesSelected =
    selectedEntries.length > 0 && selectedEntries.every((e) => e.kind === 'file');

  const trashSelected = () =>
    run(async () => {
      for (const p of selectedPaths()) await moveToTrash(backend, p);
      setSelected([]);
    });

  const paste = () =>
    dir &&
    clip &&
    run(async () => {
      for (const p of clip.paths) {
        if (clip.mode === 'cut') await moveEntry(backend, p, dir);
        else await copyEntry(backend, p, backend, dir);
      }
      if (clip.mode === 'cut') setClip(null);
    });

  const download = () =>
    dir &&
    run(async () => {
      for (const e of selectedEntries) {
        if (e.kind === 'file') downloadBlob(await backend.read([...dir, e.name]), e.name);
      }
    });

  const upload = (files: FileList | null, keepFolders: boolean, target: Path | null = dir) => {
    if (!files || files.length === 0 || !target) return;
    const list = [...files].map((file) => ({
      file,
      relativePath: keepFolders ? file.webkitRelativePath || file.name : file.name,
    }));
    run(async () => {
      const count = await importFiles(backend, target, list);
      return t('files.imported', { count });
    });
  };

  const restoreSelected = () =>
    run(async () => {
      for (const item of trash.filter((i) => selected.includes(i.id))) {
        await restoreFromTrash(backend, item);
      }
      setSelected([]);
    });

  function onKeyDown(e: KeyboardEvent) {
    if (dialog || (e.target as Element).closest('input, .modal')) return;
    const ctrl = e.ctrlKey || e.metaKey;
    let handled = true;
    if (e.key === 'Delete') {
      if (view.kind === 'trash') {
        if (selected.length) setDialog({ type: 'confirmPurge', ids: selected });
      } else if (selected.length) trashSelected();
    } else if (e.key === 'F2' && selected.length === 1 && view.kind === 'dir') {
      setDialog({ type: 'rename', name: selected[0] as string });
    } else if (e.key === 'Enter' && selected.length === 1) {
      open(selected[0] as string);
    } else if (e.key === 'Backspace') {
      goUp();
    } else if (ctrl && e.key.toLowerCase() === 'a') {
      setSelected(visibleNames);
    } else if (ctrl && e.key.toLowerCase() === 'c' && selected.length && dir) {
      setClip({ mode: 'copy', paths: selectedPaths() });
    } else if (ctrl && e.key.toLowerCase() === 'x' && selected.length && dir) {
      setClip({ mode: 'cut', paths: selectedPaths() });
    } else if (ctrl && e.key.toLowerCase() === 'v' && clip) {
      paste();
    } else {
      handled = false;
    }
    if (handled) e.preventDefault();
  }

  // ---------- Görünüm ----------

  const storageLabel =
    backend instanceof HandleBackend && backend.kind === 'device'
      ? t('storage.where.device', { name: backend.rootName })
      : t(
          backend.kind === 'idb'
            ? 'storage.where.idb'
            : backend.kind === 'memory'
              ? 'storage.where.memory'
              : 'storage.where.opfs',
        );
  const StorageIcon = backend.kind === 'device' ? HardDrive : Globe;
  const crumbs = dir ?? [];
  const itemCount = view.kind === 'trash' ? trash.length : (entries?.length ?? 0);
  const existingNames = (entries ?? []).map((e) => e.name.toLocaleLowerCase('tr'));
  const validateNew = (name: string) =>
    validateName(name) ??
    (existingNames.includes(name.trim().toLocaleLowerCase('tr')) ? 'files.err.exists' : null);

  return (
    <div className="files" data-layout={layout} onKeyDown={onKeyDown}>
      <div className="files__bar">
        <div className="files__nav">
          <ToolButton
            icon={ArrowLeft}
            label={t('files.back')}
            onClick={() => goHistory(-1)}
            disabled={history.index === 0}
          />
          <ToolButton
            icon={ArrowRight}
            label={t('files.forward')}
            onClick={() => goHistory(1)}
            disabled={history.index >= history.stack.length - 1}
          />
          <ToolButton
            icon={ArrowUp}
            label={t('files.up')}
            onClick={goUp}
            disabled={!dir || dir.length === 0}
          />
        </div>
        <nav ref={crumbsRef} className="files__crumbs" aria-label={t('files.location')}>
          {view.kind === 'trash' ? (
            <span className="crumb crumb--current">{t('files.trash')}</span>
          ) : (
            <>
              <button
                type="button"
                className="crumb"
                onClick={() => navigate({ kind: 'dir', path: [] })}
                aria-current={crumbs.length === 0 ? 'location' : undefined}
              >
                {t('files.home')}
              </button>
              {crumbs.map((part, i) => (
                <span key={i} className="crumb-wrap">
                  <span aria-hidden="true">›</span>
                  <button
                    type="button"
                    className="crumb"
                    onClick={() => navigate({ kind: 'dir', path: crumbs.slice(0, i + 1) })}
                    aria-current={i === crumbs.length - 1 ? 'location' : undefined}
                  >
                    {part}
                  </button>
                </span>
              ))}
            </>
          )}
        </nav>
        <div className="files__nav">
          <ToolButton
            icon={layout === 'grid' ? List : LayoutGrid}
            label={layout === 'grid' ? t('files.viewList') : t('files.viewGrid')}
            onClick={() => {
              const next = layout === 'grid' ? 'list' : 'grid';
              setLayout(next);
              writePref(LAYOUT_PREF, next);
            }}
          />
          <ToolButton icon={RefreshCw} label={t('files.refresh')} onClick={storage.changed} />
        </div>
      </div>

      <div className="files__actions" role="toolbar" aria-label={t('files.actions')}>
        {view.kind === 'trash' ? (
          selected.length > 0 ? (
            <>
              <ToolButton icon={RotateCcw} label={t('files.restore')} onClick={restoreSelected} />
              <ToolButton
                icon={Trash2}
                label={t('files.deleteForever')}
                onClick={() => setDialog({ type: 'confirmPurge', ids: selected })}
              />
            </>
          ) : (
            <ToolButton
              icon={Trash2}
              label={t('files.emptyTrash')}
              onClick={() => setDialog({ type: 'confirmEmpty' })}
              disabled={trash.length === 0}
            />
          )
        ) : selected.length > 0 ? (
          <>
            {selected.length === 1 && (
              <ToolButton
                icon={FolderOpen}
                label={t('files.open')}
                onClick={() => open(selected[0] as string)}
              />
            )}
            {selected.length === 1 && (
              <ToolButton
                icon={Pencil}
                label={t('files.rename')}
                onClick={() => setDialog({ type: 'rename', name: selected[0] as string })}
              />
            )}
            <ToolButton
              icon={Copy}
              label={t('files.copy')}
              onClick={() => setClip({ mode: 'copy', paths: selectedPaths() })}
            />
            <ToolButton
              icon={Scissors}
              label={t('files.cut')}
              onClick={() => setClip({ mode: 'cut', paths: selectedPaths() })}
            />
            <ToolButton
              icon={Download}
              label={t('files.download')}
              onClick={download}
              disabled={!onlyFilesSelected}
            />
            <ToolButton icon={Trash2} label={t('files.delete')} onClick={trashSelected} />
          </>
        ) : (
          <>
            <ToolButton
              icon={FolderPlus}
              label={t('files.newFolder')}
              onClick={() => setDialog({ type: 'newFolder' })}
            />
            <ToolButton
              icon={FilePlus}
              label={t('files.newFile')}
              onClick={() => setDialog({ type: 'newFile' })}
            />
            <ToolButton
              icon={Upload}
              label={t('files.upload')}
              onClick={() => uploadRef.current?.click()}
            />
            <ToolButton
              icon={FolderInput}
              label={t('files.importFolder')}
              onClick={() => {
                importTarget.current = dir ?? [];
                folderRef.current?.click();
              }}
            />
            {clip && (
              <ToolButton icon={ClipboardPaste} label={t('files.paste')} onClick={() => paste()} />
            )}
          </>
        )}
      </div>

      <div className="files__main">
        <nav className="files__side" aria-label={t('files.places')}>
          {PLACES.map(({ path, icon: Icon, labelKey }) => {
            const active = view.kind === 'dir' && view.path.join('/') === path.join('/');
            return (
              <button
                key={path.join('/') || 'home'}
                type="button"
                className="place"
                aria-current={active ? 'location' : undefined}
                onClick={() => navigate({ kind: 'dir', path })}
              >
                <Icon aria-hidden="true" />
                {labelKey ? t(labelKey) : path[0]}
              </button>
            );
          })}
          <button
            type="button"
            className="place"
            aria-current={view.kind === 'trash' ? 'location' : undefined}
            onClick={() => navigate({ kind: 'trash' })}
          >
            <Trash2 aria-hidden="true" />
            {t('files.trash')}
          </button>

          <div className="files__storage">
            <StorageIcon aria-hidden="true" />
            <span>{storageLabel}</span>
            <button
              type="button"
              className="link-button"
              onClick={() => setDialog({ type: 'storage' })}
            >
              {t('storage.change')}
            </button>
            <button
              type="button"
              className="link-button"
              title={t('files.importWin11Hint')}
              onClick={() => {
                importTarget.current = [];
                folderRef.current?.click();
              }}
            >
              {t('files.importWin11')}
            </button>
          </div>
        </nav>

        <section
          className="files__content"
          data-drag={dragOver}
          aria-busy={busy}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelected([]);
          }}
          onDragOver={(e) => {
            if (view.kind !== 'dir' || !e.dataTransfer.types.includes('Files')) return;
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            upload(e.dataTransfer.files, false);
          }}
        >
          {dragOver && <div className="files__drop">{t('files.dropHere')}</div>}

          {view.kind === 'dir' && entries && entries.length === 0 && (
            <div className="files__empty">
              <FolderOpen aria-hidden="true" />
              <strong>{t('files.empty')}</strong>
              <span>{t('files.emptyHint')}</span>
            </div>
          )}
          {view.kind === 'trash' && trash.length === 0 && (
            <div className="files__empty">
              <Trash2 aria-hidden="true" />
              <strong>{t('files.trashEmpty')}</strong>
            </div>
          )}

          {layout === 'list' && itemCount > 0 && (
            <div className="files__head" aria-hidden="true">
              <span>{t('files.col.name')}</span>
              <span>{view.kind === 'trash' ? t('files.col.from') : t('files.col.size')}</span>
              <span>{t('files.col.modified')}</span>
            </div>
          )}

          <ul className="files__items" aria-label={t('files.items', { count: itemCount })}>
            {view.kind === 'dir' &&
              dir &&
              (entries ?? []).map((entry) => {
                const type = fileType(entry.name, entry.kind);
                const { icon: Icon, color } = TYPE_ICON[type];
                const isSelected = selected.includes(entry.name);
                const isCut =
                  clip?.mode === 'cut' &&
                  clip.paths.some((p) => p.join('/') === [...dir, entry.name].join('/'));
                return (
                  <li
                    key={entry.name}
                    className="file-item"
                    data-selected={isSelected}
                    data-cut={isCut}
                  >
                    <button
                      type="button"
                      className="file-item__main"
                      aria-pressed={isSelected}
                      onClick={(e) => onItemClick(e, entry.name)}
                      onDoubleClick={() => !touchUi && open(entry.name)}
                      onPointerDown={(e) => startLongPress(entry.name, e.pointerType)}
                      onPointerUp={cancelLongPress}
                      onPointerLeave={cancelLongPress}
                      onContextMenu={(e) => {
                        if (touchUi) e.preventDefault();
                      }}
                    >
                      <span className="file-item__icon" style={{ color }}>
                        {type === 'image' && layout === 'grid' && entry.size < 8_000_000 ? (
                          <Thumb backend={backend} path={[...dir, entry.name]} fallback={Icon} />
                        ) : (
                          <Icon aria-hidden="true" />
                        )}
                      </span>
                      <span className="file-item__name">{entry.name}</span>
                      <span className="file-item__meta">
                        {entry.kind === 'file' ? formatSize(entry.size, locale) : ''}
                      </span>
                      <span className="file-item__meta">{formatDate(entry.modified, locale)}</span>
                    </button>
                    {touchUi && (
                      <button
                        type="button"
                        className="file-item__check"
                        aria-label={t('files.select', { name: entry.name })}
                        aria-pressed={isSelected}
                        onClick={() => toggle(entry.name)}
                      >
                        {isSelected && <Check aria-hidden="true" />}
                      </button>
                    )}
                  </li>
                );
              })}

            {view.kind === 'trash' &&
              trash.map((item) => {
                const { icon: Icon, color } = TYPE_ICON[fileType(item.name, item.kind)];
                const isSelected = selected.includes(item.id);
                return (
                  <li key={item.id} className="file-item" data-selected={isSelected}>
                    <button
                      type="button"
                      className="file-item__main"
                      aria-pressed={isSelected}
                      onClick={(e) => onItemClick(e, item.id)}
                    >
                      <span className="file-item__icon" style={{ color }}>
                        <Icon aria-hidden="true" />
                      </span>
                      <span className="file-item__name">{item.name}</span>
                      <span className="file-item__meta">
                        {[t('files.home'), ...item.originalPath.slice(0, -1)].join(' › ')}
                      </span>
                      <span className="file-item__meta">{formatDate(item.deletedAt, locale)}</span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      </div>

      <footer className="files__status">
        <span>{t('files.items', { count: itemCount })}</span>
        {selected.length > 0 && <span>{t('files.selected', { count: selected.length })}</span>}
        <span className="files__message" role="status">
          {busy ? t('storage.busy') : message}
        </span>
        <span className="files__where">
          <StorageIcon aria-hidden="true" />
          {storageLabel}
        </span>
      </footer>

      <input
        ref={uploadRef}
        type="file"
        multiple
        hidden
        data-testid="files-upload"
        onChange={(e) => {
          upload(e.target.files, false);
          e.target.value = '';
        }}
      />
      <input
        ref={(el) => {
          folderRef.current = el;
          el?.setAttribute('webkitdirectory', '');
        }}
        type="file"
        multiple
        hidden
        data-testid="files-folder"
        onChange={(e) => {
          upload(e.target.files, true, importTarget.current);
          e.target.value = '';
        }}
      />

      {dialog?.type === 'newFolder' && dir && (
        <PromptDialog
          title={t('files.newFolder')}
          label={t('files.nameLabel')}
          initial={t('files.newFolderName')}
          submitLabel={t('files.create')}
          validate={validateNew}
          onCancel={() => setDialog(null)}
          onSubmit={(name) => {
            setDialog(null);
            run(async () => {
              await createFolder(backend, dir, name);
              setSelected([name]);
            });
          }}
        />
      )}
      {dialog?.type === 'newFile' && dir && (
        <PromptDialog
          title={t('files.newFile')}
          label={t('files.nameLabel')}
          initial={t('files.newFileName')}
          submitLabel={t('files.create')}
          validate={validateNew}
          onCancel={() => setDialog(null)}
          onSubmit={(name) => {
            setDialog(null);
            run(async () => {
              await createFile(backend, dir, name, '');
              setSelected([name]);
            });
          }}
        />
      )}
      {dialog?.type === 'rename' && dir && (
        <PromptDialog
          title={t('files.rename')}
          label={t('files.nameLabel')}
          initial={dialog.name}
          submitLabel={t('files.save')}
          validate={(name) =>
            validateName(name) ??
            (name.trim().toLocaleLowerCase('tr') !== dialog.name.toLocaleLowerCase('tr') &&
            existingNames.includes(name.trim().toLocaleLowerCase('tr'))
              ? 'files.err.exists'
              : null)
          }
          onCancel={() => setDialog(null)}
          onSubmit={(name) => {
            const old = dialog.name;
            setDialog(null);
            run(async () => {
              await renameEntry(backend, [...dir, old], name);
              setSelected([name]);
            });
          }}
        />
      )}
      {dialog?.type === 'confirmEmpty' && (
        <ConfirmDialog
          title={t('files.confirmEmpty.title')}
          text={t('files.confirmEmpty.text')}
          confirmLabel={t('files.emptyTrash')}
          danger
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            setDialog(null);
            run(() => emptyTrash(backend));
          }}
        />
      )}
      {dialog?.type === 'confirmPurge' && (
        <ConfirmDialog
          title={t('files.confirmPurge.title')}
          text={t('files.confirmPurge.text', { count: dialog.ids.length })}
          confirmLabel={t('files.deleteForever')}
          danger
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            const ids = dialog.ids;
            setDialog(null);
            run(async () => {
              for (const id of ids) await deleteFromTrash(backend, id);
              setSelected([]);
            });
          }}
        />
      )}
      {dialog?.type === 'preview' && (
        <Preview backend={backend} path={dialog.path} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'storage' && (
        <StorageChooser
          scope="window"
          onDone={() => setDialog(null)}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
