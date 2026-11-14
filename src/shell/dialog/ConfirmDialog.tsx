import { useI18n } from '../../i18n/context.ts';
import { Modal } from './Modal.tsx';

export function ConfirmDialog({
  title,
  text,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  text: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal
      title={title}
      onClose={onCancel}
      actions={
        <>
          <button type="button" className="btn primary" onClick={onCancel}>
            {t('files.cancel')}
          </button>
          <button type="button" className={`btn ${danger ? 'danger' : ''}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{text}</p>
    </Modal>
  );
}
