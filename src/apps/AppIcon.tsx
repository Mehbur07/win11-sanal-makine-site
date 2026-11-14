import type { CSSProperties } from 'react';
import type { AppDefinition } from './types.ts';
import './AppIcon.css';

type IconSize = 'sm' | 'md' | 'lg';

// Uygulama simgesi: koyu kare içinde neon renkli çizgi simge (ya da uygulamanın logosu)
export function AppIcon({ app, size = 'md' }: { app: AppDefinition; size?: IconSize }) {
  const style = { '--c': app.color } as CSSProperties;
  const Icon = app.icon;

  return (
    <span className={`app-icon app-icon--${size}`} style={style} aria-hidden="true">
      {'src' in Icon ? (
        <img className="app-icon__img" src={Icon.src} alt="" draggable={false} />
      ) : (
        <Icon className="app-icon__glyph" strokeWidth={1.8} />
      )}
    </span>
  );
}
