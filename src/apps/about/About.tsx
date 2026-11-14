import { useI18n } from '../../i18n/context.ts';
import type { MessageKey } from '../../i18n/messages.ts';
import './About.css';

const SHORTCUTS: [string, MessageKey][] = [
  ['Alt + M', 'shortcut.menu'],
  ['Alt + Q', 'shortcut.close'],
  ['Alt + ↑', 'shortcut.max'],
  ['Alt + ← / →', 'shortcut.snap'],
  ['Alt + ↓', 'shortcut.min'],
  ['Alt + D', 'shortcut.desktop'],
  ['Esc', 'shortcut.esc'],
];

const TOUCH_TIPS: MessageKey[] = ['touch.split', 'touch.max', 'touch.menu'];

const LINKS: [string, MessageKey][] = [
  ['https://github.com/virtualmos/virtualmos.github.io', 'about.source'],
  [
    'https://github.com/virtualmos/virtualmos.github.io/blob/main/docs/yol-haritasi.md',
    'about.roadmap',
  ],
  ['https://mehbur07.github.io/', 'about.site'],
];

// "Hakkında" uygulaması: VirtualMOS tanıtımı, kısayollar ve bağlantılar
export function About() {
  const { t } = useI18n();

  return (
    <div className="about">
      <header className="about__head">
        <img src="/brand/mehburos-icon-256.png" alt="" width={72} height={72} />
        <div>
          <h2>VirtualMOS</h2>
          <p>{t('about.desc')}</p>
          <p className="about__dev">{t('about.dev')}</p>
        </div>
      </header>

      <section>
        <h3>{t('about.keyboard')}</h3>
        <dl className="about__keys">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={keys}>
              <dt>
                <kbd>{keys}</kbd>
              </dt>
              <dd>{t(label)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h3>{t('about.touch')}</h3>
        <ul className="about__tips">
          {TOUCH_TIPS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>{t('about.links')}</h3>
        <ul className="about__links">
          {LINKS.map(([href, label]) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {t(label)}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
