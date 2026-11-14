import { useState } from 'react';
import { useI18n } from '../i18n/context.ts';
import { Modal } from '../shell/dialog/Modal.tsx';
import { useStorage } from './context.ts';
import { StorageChooser } from './StorageChooser.tsx';

// Masaüstü açılınca: depolama yeri hiç seçilmediyse seçim penceresi,
// cihaz klasörünün izni düştüyse "İzin ver" penceresi gösterir.
export function StorageGate() {
  const { t } = useI18n();
  const storage = useStorage();
  const [dismissed, setDismissed] = useState(false);
  const { status } = storage;

  if (dismissed) return null;

  if (status.state === 'choose') {
    return <StorageChooser scope="screen" onCancel={() => setDismissed(true)} />;
  }

  if (status.state === 'permission') {
    return (
      <Modal
        title={t('storage.permission.title')}
        scope="screen"
        onClose={() => setDismissed(true)}
        actions={
          <>
            <button type="button" className="btn" onClick={() => setDismissed(true)}>
              {t('storage.permission.later')}
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={async () => {
                if (await storage.grantAccess()) setDismissed(true);
              }}
            >
              {t('storage.permission.grant')}
            </button>
          </>
        }
      >
        <p>{t('storage.permission.text', { name: status.folderName })}</p>
      </Modal>
    );
  }

  return null;
}
