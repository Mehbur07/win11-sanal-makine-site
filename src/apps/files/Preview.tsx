import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/context.ts';
import { Modal } from '../../shell/dialog/Modal.tsx';
import type { Path, StorageBackend } from '../../storage/types.ts';
import { downloadBlob, fileType, isTextLike } from './fileTypes.ts';

const MAX_TEXT = 256 * 1024;

type Content =
  | { kind: 'loading' }
  | { kind: 'image'; url: string }
  | { kind: 'text'; text: string }
  | { kind: 'none' }
  | { kind: 'error'; message: string };

// Hızlı önizleme: resim ve metin dosyaları pencere içinde gösterilir, diğerleri indirilebilir
export function Preview({
  backend,
  path,
  onClose,
}: {
  backend: StorageBackend;
  path: Path;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const name = path[path.length - 1] ?? '';
  const [content, setContent] = useState<Content>({ kind: 'loading' });

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    const type = fileType(name, 'file');
    backend
      .read(path)
      .then(async (blob) => {
        if (cancelled) return;
        if (type === 'image') {
          url = URL.createObjectURL(blob);
          setContent({ kind: 'image', url });
        } else if (isTextLike(type) && blob.size <= MAX_TEXT) {
          const text = await blob.text();
          if (!cancelled) setContent({ kind: 'text', text });
        } else {
          setContent({ kind: 'none' });
        }
      })
      .catch((e) => !cancelled && setContent({ kind: 'error', message: String(e) }));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // path dizisi her çizimde yeni olabilir; yol metni değişince yeniden yükle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend, path.join('/'), name]);

  const download = async () => downloadBlob(await backend.read(path), name);

  return (
    <Modal
      title={name}
      onClose={onClose}
      wide
      actions={
        <>
          <button type="button" className="btn" onClick={download}>
            <Download aria-hidden="true" />
            {t('files.download')}
          </button>
          <button type="button" className="btn primary" onClick={onClose}>
            {t('files.close')}
          </button>
        </>
      }
    >
      <div className="preview">
        {content.kind === 'image' && <img src={content.url} alt={name} />}
        {content.kind === 'text' && <pre>{content.text}</pre>}
        {content.kind === 'none' && <p>{t('files.noPreview')}</p>}
        {content.kind === 'error' && (
          <p className="field__error">{t('files.err.generic', { message: content.message })}</p>
        )}
      </div>
    </Modal>
  );
}
