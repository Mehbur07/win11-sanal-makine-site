import { Expand, Languages, Monitor, Moon, type LucideIcon } from 'lucide-react';
import { useI18n } from '../../i18n/context.ts';
import { useTheme } from '../../settings/theme.ts';
import { Popover } from '../popover/Popover.tsx';
import { useFullscreen } from '../useFullscreen.ts';
import { useWM } from '../wm/context.ts';

function Tile({
  icon: Icon,
  label,
  value,
  pressed,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  pressed?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="tile" aria-pressed={pressed} onClick={onClick}>
      <Icon aria-hidden="true" />
      <span className="tile__label">{label}</span>
      {value && <span className="tile__value">{value}</span>}
    </button>
  );
}

// Hızlı ayarlar: dil, tema, tam ekran, masaüstünü göster
export function QuickSettings({ onClose }: { onClose: () => void }) {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const fullscreen = useFullscreen();
  const wm = useWM();
  const dark = theme === 'dark';

  return (
    <Popover label={t('panel.quickSettings')} side="right" className="quick">
      <h2 className="visually-hidden">{t('panel.quickSettings')}</h2>
      <div className="quick__grid">
        <Tile
          icon={Languages}
          label={t('quick.language')}
          value={t('quick.languageValue')}
          onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
        />
        <Tile
          icon={Moon}
          label={t('quick.darkTheme')}
          value={dark ? t('quick.on') : t('quick.off')}
          pressed={dark}
          onClick={() => setTheme(dark ? 'light' : 'dark')}
        />
        {fullscreen.supported && (
          <Tile
            icon={Expand}
            label={t('quick.fullscreen')}
            value={fullscreen.active ? t('quick.on') : t('quick.off')}
            pressed={fullscreen.active}
            onClick={fullscreen.toggle}
          />
        )}
        <Tile
          icon={Monitor}
          label={t('quick.showDesktop')}
          onClick={() => {
            wm.minimizeAll();
            onClose();
          }}
        />
      </div>
    </Popover>
  );
}
