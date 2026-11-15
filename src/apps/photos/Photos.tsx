import {
  ChevronLeft,
  ChevronRight,
  Download,
  FolderOpen,
  ImageOff,
  Palette,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useI18n } from '../../i18n/context.ts';
import { useWM } from '../../shell/wm/context.ts';
import { useStorage } from '../../storage/context.ts';
import { isHidden, moveToTrash } from '../../storage/fileOps.ts';
import { baseName, parentOf } from '../../storage/names.ts';
import type { Path, StorageBackend } from '../../storage/types.ts';
import { WithBackend } from '../../storage/WithBackend.tsx';
import { downloadBlob, fileType, TYPE_ICON } from '../files/fileTypes.ts';
import { Thumb } from '../files/Thumb.tsx';
import { FileDialog } from '../shared/FileDialog.tsx';
import type { AppProps } from '../types.ts';
import '../shared/AppToolbar.css';
import './Photos.css';

const SWIPE_PX = 50;

export function Photos(props: AppProps) {
  return <WithBackend>{(backend) => <PhotosBody {...props} backend={backend} />}</WithBackend>;
}

// Bir klasördeki resimler arasında gezinir. Dosyayla açılırsa o dosyanın klasörünü gösterir,
// yoksa Resimler klasörünü.
function PhotosBody({ windowId, args, backend }: AppProps & { backend: StorageBackend }) {
  const { t, locale } = useI18n();
  const wm = useWM();
  const storage = useStorage();
  const argKey = args?.path?.join('/') ?? '';
  const folder = argKey ? parentOf(argKey.split('/')) : ['Resimler'];
  const folderKey = folder.join('/');
  const [images, setImages] = useState<string[] | null>(null);
  const [current, setCurrent] = useState<string | null>(
    argKey ? baseName(argKey.split('/')) : null,
  );
  const [loaded, setLoaded] = useState<{ name: string; url: string } | null>(null);
  const [prevArg, setPrevArg] = useState(argKey);
  const [picking, setPicking] = useState(false);
  const swipe = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Dosyalar'dan başka bir resim açılınca o resme geç
  if (argKey !== prevArg) {
    setPrevArg(argKey);
    if (argKey) setCurrent(baseName(argKey.split('/')));
  }

  // Klasördeki resimleri listele
  useEffect(() => {
    let cancelled = false;
    backend
      .list(folderKey ? folderKey.split('/') : [])
      .then((list) => {
        if (cancelled) return;
        const names = list
          .filter(
            (e) => e.kind === 'file' && !isHidden(e.name) && fileType(e.name, 'file') === 'image',
          )
          .map((e) => e.name)
          .sort((a, b) => a.localeCompare(b, locale, { numeric: true }));
        setImages(names);
        setCurrent((c) => (c && names.includes(c) ? c : (names[0] ?? null)));
      })
      .catch(() => !cancelled && setImages([]));
    return () => {
      cancelled = true;
    };
  }, [backend, folderKey, storage.rev, locale]);

  // Seçili resmi yükle
  useEffect(() => {
    if (!current) return;
    let created: string | null = null;
    let cancelled = false;
    backend
      .read([...folder, current])
      .then((blob) => {
        if (cancelled) return;
        created = URL.createObjectURL(blob);
        setLoaded({ name: current, url: created });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- folder, folderKey ile temsil ediliyor
  }, [backend, folderKey, current]);

  useEffect(() => {
    wm.setTitle(windowId, current ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowId, current]);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  const url = loaded && loaded.name === current ? loaded.url : null;
  const list = images ?? [];
  const index = current ? list.indexOf(current) : -1;
  const go = (delta: number) => {
    if (list.length === 0) return;
    setCurrent(list[(index + delta + list.length) % list.length] ?? null);
  };
  const currentPath: Path | null = current ? [...folder, current] : null;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else return;
    e.preventDefault();
  }

  // Dokunmatik: sola/sağa kaydırarak resim değiştir
  const onPointerDown = (e: PointerEvent) => {
    swipe.current = e.clientX;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (swipe.current === null) return;
    const dx = e.clientX - swipe.current;
    swipe.current = null;
    if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
  };

  async function remove() {
    if (!currentPath) return;
    const next = list[index + 1] ?? list[index - 1] ?? null;
    await moveToTrash(backend, currentPath);
    setCurrent(next);
    storage.changed();
  }

  return (
    <div className="photos" ref={rootRef} tabIndex={-1} onKeyDown={onKeyDown}>
      <div className="app-toolbar" role="toolbar" aria-label={t('photos.toolbar')}>
        <button
          type="button"
          className="tool"
          title={t('dialog.open')}
          onClick={() => setPicking(true)}
        >
          <FolderOpen aria-hidden="true" />
          <span className="tool__label">{t('dialog.open')}</span>
        </button>
        <span className="app-toolbar__sep" />
        <button
          type="button"
          className="tool"
          title={t('photos.edit')}
          disabled={!currentPath}
          onClick={() => currentPath && wm.open('paint', { path: currentPath })}
        >
          <Palette aria-hidden="true" />
          <span className="tool__label">{t('photos.edit')}</span>
        </button>
        <button
          type="button"
          className="tool"
          title={t('files.download')}
          disabled={!currentPath}
          onClick={async () =>
            currentPath && downloadBlob(await backend.read(currentPath), current!)
          }
        >
          <Download aria-hidden="true" />
          <span className="tool__label">{t('files.download')}</span>
        </button>
        <button
          type="button"
          className="tool"
          title={t('files.delete')}
          disabled={!currentPath}
          onClick={remove}
        >
          <Trash2 aria-hidden="true" />
          <span className="tool__label">{t('files.delete')}</span>
        </button>
        <span className="photos__count">
          {list.length > 0 && index >= 0 ? `${index + 1} / ${list.length}` : ''}
        </span>
      </div>

      <div className="photos__view" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        {images && list.length === 0 ? (
          <div className="photos__empty">
            <ImageOff aria-hidden="true" />
            <p>{t('photos.empty', { folder: folder.join(' › ') || t('files.home') })}</p>
            <button type="button" className="btn" onClick={() => wm.open('files')}>
              {t('photos.openFiles')}
            </button>
          </div>
        ) : (
          url && <img className="photos__image" src={url} alt={current ?? ''} draggable={false} />
        )}
        {list.length > 1 && (
          <>
            <button
              type="button"
              className="photos__nav photos__nav--prev"
              aria-label={t('photos.prev')}
              onClick={() => go(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="photos__nav photos__nav--next"
              aria-label={t('photos.next')}
              onClick={() => go(1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {list.length > 1 && (
        <ul className="photos__strip" aria-label={t('photos.strip')}>
          {list.map((name) => (
            <li key={name}>
              <button
                type="button"
                aria-label={name}
                aria-current={name === current ? 'true' : undefined}
                onClick={() => setCurrent(name)}
              >
                <Thumb backend={backend} path={[...folder, name]} fallback={TYPE_ICON.image.icon} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {picking && (
        <FileDialog
          mode="open"
          backend={backend}
          startDir={folder}
          accept={(name) => fileType(name, 'file') === 'image'}
          onCancel={() => setPicking(false)}
          onPick={(target) => {
            setPicking(false);
            wm.open('photos', { path: target });
          }}
        />
      )}
    </div>
  );
}
