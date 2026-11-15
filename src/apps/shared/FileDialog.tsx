import { ArrowUp, Folder } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/context.ts';
import { Modal } from '../../shell/dialog/Modal.tsx';
import { isHidden } from '../../storage/fileOps.ts';
import { validateName } from '../../storage/names.ts';
import type { Entry, Path, StorageBackend } from '../../storage/types.ts';
import { fileType, TYPE_ICON } from '../files/fileTypes.ts';
import './FileDialog.css';

// Uygulamalar için "Aç" ve "Kaydet" penceresi: VirtualMOS klasörlerinde gezip dosya seçer
// ya da kaydedilecek yeri ve adı belirler.
export function FileDialog({
  mode,
  backend,
  startDir,
  defaultName = '',
  accept,
  onPick,
  onCancel,
}: {
  mode: 'open' | 'save';
  backend: StorageBackend;
  startDir: Path;
  defaultName?: string;
  /** Hangi dosyalar gösterilsin/seçilebilsin */
  accept: (name: string) => boolean;
  onPick: (path: Path) => void;
  onCancel: () => void;
}) {
  const { t, locale } = useI18n();
  const [dir, setDir] = useState<Path>(startDir);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState(defaultName);
  const [selected, setSelected] = useState<string | null>(null);
  const dirKey = dir.join('/');

  useEffect(() => {
    let cancelled = false;
    backend
      .list(dirKey ? dirKey.split('/') : [])
      .then((list) => {
        if (cancelled) return;
        const visible = list.filter(
          (e) => !isHidden(e.name) && (e.kind === 'dir' || accept(e.name)),
        );
        visible.sort((a, b) =>
          a.kind !== b.kind
            ? a.kind === 'dir'
              ? -1
              : 1
            : a.name.localeCompare(b.name, locale, { numeric: true }),
        );
        setEntries(visible);
      })
      .catch(() => !cancelled && setDir([]));
    return () => {
      cancelled = true;
    };
    // accept her çizimde yeni fonksiyon olabilir; klasör değişince yeniden yükle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend, dirKey, locale]);

  const nameError = mode === 'save' ? validateName(name) : null;
  const exists =
    mode === 'save' && entries.some((e) => e.kind === 'file' && e.name === name.trim());
  const canSubmit = mode === 'save' ? !nameError : selected !== null;

  const submit = () => {
    if (mode === 'save' && !nameError) onPick([...dir, name.trim()]);
    if (mode === 'open' && selected) onPick([...dir, selected]);
  };

  return (
    <Modal
      title={mode === 'open' ? t('dialog.open') : t('dialog.saveAs')}
      onClose={onCancel}
      wide
      actions={
        <>
          <button type="button" className="btn" onClick={onCancel}>
            {t('files.cancel')}
          </button>
          <button type="button" className="btn primary" disabled={!canSubmit} onClick={submit}>
            {mode === 'open' ? t('files.open') : exists ? t('dialog.overwrite') : t('files.save')}
          </button>
        </>
      }
    >
      <div className="file-dialog__path">
        <button
          type="button"
          className="btn"
          aria-label={t('files.up')}
          disabled={dir.length === 0}
          onClick={() => {
            setDir(dir.slice(0, -1));
            setSelected(null);
          }}
        >
          <ArrowUp aria-hidden="true" />
        </button>
        <span>{[t('files.home'), ...dir].join(' › ')}</span>
      </div>
      <ul className="file-dialog__list" aria-label={t('files.location')}>
        {entries.map((e) => {
          const { icon: Icon, color } =
            e.kind === 'dir'
              ? { icon: Folder, color: '#FFC25A' }
              : TYPE_ICON[fileType(e.name, e.kind)];
          return (
            <li key={e.name}>
              <button
                type="button"
                aria-pressed={selected === e.name}
                onClick={() => {
                  if (e.kind === 'dir') {
                    setDir([...dir, e.name]);
                    setSelected(null);
                  } else {
                    setSelected(e.name);
                    if (mode === 'save') setName(e.name);
                  }
                }}
                onDoubleClick={() => {
                  if (e.kind === 'file' && mode === 'open') onPick([...dir, e.name]);
                }}
              >
                <Icon aria-hidden="true" style={{ color }} />
                {e.name}
              </button>
            </li>
          );
        })}
        {entries.length === 0 && <li className="file-dialog__empty">{t('files.empty')}</li>}
      </ul>
      {mode === 'save' && (
        <label className="field">
          {t('files.nameLabel')}
          <input
            value={name}
            aria-invalid={nameError ? true : undefined}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
          {nameError && name && <span className="field__error">{t(nameError)}</span>}
          {exists && <span className="field__error">{t('dialog.exists')}</span>}
        </label>
      )}
    </Modal>
  );
}
