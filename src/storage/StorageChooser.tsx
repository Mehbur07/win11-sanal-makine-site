import { Globe, HardDrive } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../i18n/context.ts';
import { Modal } from '../shell/dialog/Modal.tsx';
import { useStorage } from './context.ts';
import './StorageChooser.css';

// "Dosyalar nerede saklansın?" penceresi: ilk açılışta ve Dosyalar'dan konum değiştirirken
export function StorageChooser({
  scope,
  onDone,
  onCancel,
}: {
  scope: 'window' | 'screen';
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const { t } = useI18n();
  const storage = useStorage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(action: () => Promise<boolean | void>) {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (result !== false) onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const current = storage.status.state === 'ready' ? storage.status.location : null;

  return (
    <Modal
      title={t('storage.choose.title')}
      scope={scope}
      onClose={onCancel}
      wide
      actions={
        onCancel && (
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            {t('files.cancel')}
          </button>
        )
      }
    >
      <p>{t('storage.choose.text')}</p>
      <div className="storage-options">
        <button
          type="button"
          className="storage-option"
          disabled={busy || !storage.canPickFolder}
          aria-pressed={current === 'device'}
          onClick={() => pick(storage.chooseDevice)}
        >
          <HardDrive aria-hidden="true" />
          <strong>{t('storage.device.title')}</strong>
          <span>{storage.canPickFolder ? t('storage.device.desc') : t('storage.noPicker')}</span>
        </button>
        <button
          type="button"
          className="storage-option"
          disabled={busy}
          aria-pressed={current === 'browser'}
          onClick={() => pick(storage.chooseBrowser)}
        >
          <Globe aria-hidden="true" />
          <strong>{t('storage.browser.title')}</strong>
          <span>{t('storage.browser.desc')}</span>
        </button>
      </div>
      {busy && <p role="status">{t('storage.busy')}</p>}
      {error && (
        <p className="field__error" role="alert">
          {t('storage.error', { message: error })}
        </p>
      )}
    </Modal>
  );
}
