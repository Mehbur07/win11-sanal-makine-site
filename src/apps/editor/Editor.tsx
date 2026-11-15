import { FilePlus, FolderOpen, Minus, Plus, Save, SaveAll, WrapText } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useI18n } from '../../i18n/context.ts';
import { readPref, writePref } from '../../lib/prefs.ts';
import { useWM } from '../../shell/wm/context.ts';
import { useStorage } from '../../storage/context.ts';
import { baseName, parentOf } from '../../storage/names.ts';
import type { Path, StorageBackend } from '../../storage/types.ts';
import { WithBackend } from '../../storage/WithBackend.tsx';
import { fileType, isTextLike } from '../files/fileTypes.ts';
import { FileDialog } from '../shared/FileDialog.tsx';
import type { AppProps } from '../types.ts';
import '../shared/AppToolbar.css';
import './Editor.css';

const WRAP_PREF = 'vmos:editor:wrap';
const SIZE_PREF = 'vmos:editor:size';
const acceptText = (name: string) => isTextLike(fileType(name, 'file'));

export function Editor(props: AppProps) {
  return <WithBackend>{(backend) => <EditorBody {...props} backend={backend} />}</WithBackend>;
}

function EditorBody({ windowId, args, backend }: AppProps & { backend: StorageBackend }) {
  const { t } = useI18n();
  const wm = useWM();
  const storage = useStorage();
  const [path, setPath] = useState<Path | null>(args?.path ?? null);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(!!args?.path);
  const [dialog, setDialog] = useState<'open' | 'save' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [wrap, setWrap] = useState(() => readPref(WRAP_PREF) !== 'off');
  const [size, setSize] = useState(() => Number(readPref(SIZE_PREF)) || 15);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const area = useRef<HTMLTextAreaElement>(null);
  const dirty = text !== saved;

  // Dosyayla açıldıysa içeriği yükle
  const initialPath = args?.path?.join('/');
  useEffect(() => {
    if (!initialPath) return;
    let cancelled = false;
    backend
      .read(initialPath.split('/'))
      .then((blob) => blob.text())
      .then((content) => {
        if (cancelled) return;
        setText(content);
        setSaved(content);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setMessage(t('files.err.generic', { message: String(e) }));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca açılıştaki dosya
  }, [backend, initialPath]);

  // Pencere başlığı: dosya adı; kaydedilmemiş değişiklik varsa pencere bunu bilir
  useEffect(() => {
    wm.setTitle(windowId, path ? baseName(path) : t('editor.untitled'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowId, path, t]);
  useEffect(() => {
    wm.setDirty(windowId, dirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowId, dirty]);

  async function saveTo(target: Path) {
    try {
      await backend.write(target, text);
      setPath(target);
      setSaved(text);
      setMessage(t('editor.saved', { name: baseName(target) }));
      storage.changed();
    } catch (e) {
      setMessage(t('files.err.generic', { message: e instanceof Error ? e.message : String(e) }));
    }
  }

  async function openFile(target: Path) {
    // Başka bir dosya yeni pencerede açılır; bu penceredeki yazı kaybolmaz
    if (dirty || path) {
      wm.open('editor', { path: target });
      return;
    }
    const content = await (await backend.read(target)).text();
    setPath(target);
    setText(content);
    setSaved(content);
  }

  const save = () => (path ? saveTo(path) : setDialog('save'));

  function updateCursor() {
    const el = area.current;
    if (!el) return;
    const before = el.value.slice(0, el.selectionStart);
    const lines = before.split('\n');
    setCursor({ line: lines.length, col: (lines[lines.length - 1]?.length ?? 0) + 1 });
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === 's') {
      e.preventDefault();
      if (e.shiftKey) setDialog('save');
      else save();
    } else if (key === 'o') {
      e.preventDefault();
      setDialog('open');
    }
  }

  const changeSize = (delta: number) => {
    const next = Math.min(32, Math.max(10, size + delta));
    setSize(next);
    writePref(SIZE_PREF, String(next));
  };

  return (
    <div className="editor" onKeyDown={onKeyDown}>
      <div className="app-toolbar" role="toolbar" aria-label={t('editor.toolbar')}>
        <button
          type="button"
          className="tool"
          onClick={() => wm.open('editor')}
          title={t('editor.new')}
        >
          <FilePlus aria-hidden="true" />
          <span className="tool__label">{t('editor.new')}</span>
        </button>
        <button
          type="button"
          className="tool"
          onClick={() => setDialog('open')}
          title={t('dialog.open')}
        >
          <FolderOpen aria-hidden="true" />
          <span className="tool__label">{t('dialog.open')}</span>
        </button>
        <button type="button" className="tool" onClick={save} title={t('files.save')}>
          <Save aria-hidden="true" />
          <span className="tool__label">{t('files.save')}</span>
        </button>
        <button
          type="button"
          className="tool"
          onClick={() => setDialog('save')}
          title={t('dialog.saveAs')}
        >
          <SaveAll aria-hidden="true" />
          <span className="tool__label">{t('dialog.saveAs')}</span>
        </button>
        <span className="app-toolbar__sep" />
        <button
          type="button"
          className="tool"
          aria-pressed={wrap}
          title={t('editor.wrap')}
          onClick={() => {
            setWrap(!wrap);
            writePref(WRAP_PREF, wrap ? 'off' : 'on');
          }}
        >
          <WrapText aria-hidden="true" />
          <span className="tool__label">{t('editor.wrap')}</span>
        </button>
        <button
          type="button"
          className="tool"
          aria-label={t('editor.smaller')}
          title={t('editor.smaller')}
          onClick={() => changeSize(-1)}
        >
          <Minus aria-hidden="true" />
        </button>
        <span className="editor__size">{size}</span>
        <button
          type="button"
          className="tool"
          aria-label={t('editor.bigger')}
          title={t('editor.bigger')}
          onClick={() => changeSize(1)}
        >
          <Plus aria-hidden="true" />
        </button>
      </div>

      <textarea
        ref={area}
        className="editor__area"
        aria-label={t('editor.content')}
        value={text}
        disabled={loading}
        spellCheck={false}
        wrap={wrap ? 'soft' : 'off'}
        style={{ fontSize: size }}
        onChange={(e) => {
          setText(e.target.value);
          setMessage(null);
        }}
        onSelect={updateCursor}
        onKeyUp={updateCursor}
        onClick={updateCursor}
      />

      <footer className="app-status">
        <span>{t('editor.position', cursor)}</span>
        <span>{t('editor.chars', { count: text.length })}</span>
        <span className="app-status__msg" role="status">
          {message}
        </span>
        <span>UTF-8</span>
      </footer>

      {dialog && (
        <FileDialog
          mode={dialog}
          backend={backend}
          startDir={path ? parentOf(path) : ['Belgeler']}
          defaultName={path ? baseName(path) : t('editor.defaultName')}
          accept={acceptText}
          onCancel={() => setDialog(null)}
          onPick={(target) => {
            setDialog(null);
            if (dialog === 'save') saveTo(target);
            else openFile(target).catch((e) => setMessage(String(e)));
          }}
        />
      )}
    </div>
  );
}
