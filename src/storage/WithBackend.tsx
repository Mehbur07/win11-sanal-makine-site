import { FolderOpen } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useI18n } from '../i18n/context.ts';
import { useStorage } from './context.ts';
import { StorageChooser } from './StorageChooser.tsx';
import type { StorageBackend } from './types.ts';
import './WithBackend.css';

// Dosya kullanan uygulamalar için kapı: depolama hazırsa içeriği gösterir,
// değilse yer seçtirir ya da klasör izni ister.
export function WithBackend({ children }: { children: (backend: StorageBackend) => ReactNode }) {
  const { t } = useI18n();
  const storage = useStorage();
  const [choosing, setChoosing] = useState(false);
  const { status } = storage;

  if (status.state === 'ready') return <>{children(status.backend)}</>;

  return (
    <div className="storage-needed">
      <FolderOpen aria-hidden="true" />
      {status.state === 'loading' && <p role="status">{t('storage.loading')}</p>}
      {status.state === 'choose' && (
        <>
          <p>{t('files.needStorage')}</p>
          <button type="button" className="btn primary" onClick={() => setChoosing(true)}>
            {t('files.chooseStorage')}
          </button>
        </>
      )}
      {status.state === 'permission' && (
        <>
          <p>{t('storage.permission.text', { name: status.folderName })}</p>
          <button type="button" className="btn primary" onClick={() => storage.grantAccess()}>
            {t('storage.permission.grant')}
          </button>
        </>
      )}
      {status.state === 'error' && (
        <p className="field__error">{t('storage.error', { message: status.message })}</p>
      )}
      {choosing && (
        <StorageChooser
          scope="window"
          onDone={() => setChoosing(false)}
          onCancel={() => setChoosing(false)}
        />
      )}
    </div>
  );
}
