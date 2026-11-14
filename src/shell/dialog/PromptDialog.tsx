import { useState } from 'react';
import { useI18n } from '../../i18n/context.ts';
import type { MessageKey } from '../../i18n/messages.ts';
import { Modal } from './Modal.tsx';

// Ad sorma penceresi (yeni klasör, yeniden adlandır...). Ad geçersizse altında hata gösterir.
export function PromptDialog({
  title,
  label,
  initial,
  submitLabel,
  validate,
  onSubmit,
  onCancel,
}: {
  title: string;
  label: string;
  initial: string;
  submitLabel: string;
  validate: (value: string) => MessageKey | null;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(false);
  const error = validate(value);
  const showError = touched && error;

  const submit = () => {
    setTouched(true);
    if (!error) onSubmit(value.trim());
  };

  return (
    <Modal
      title={title}
      onClose={onCancel}
      actions={
        <>
          <button type="button" className="btn" onClick={onCancel}>
            {t('files.cancel')}
          </button>
          <button type="button" className="btn primary" onClick={submit}>
            {submitLabel}
          </button>
        </>
      }
    >
      <label className="field">
        {label}
        <input
          value={value}
          aria-invalid={showError ? true : undefined}
          onChange={(e) => {
            setValue(e.target.value);
            setTouched(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
      </label>
      {showError && (
        <p className="field__error" role="alert">
          {t(error)}
        </p>
      )}
    </Modal>
  );
}
