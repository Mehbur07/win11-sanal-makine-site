import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Path, StorageBackend } from '../../storage/types.ts';

// Izgara görünümünde resim dosyalarının küçük önizlemesi
export function Thumb({
  backend,
  path,
  fallback: Icon,
}: {
  backend: StorageBackend;
  path: Path;
  fallback: LucideIcon;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const key = path.join('/');

  useEffect(() => {
    let created: string | null = null;
    let cancelled = false;
    backend
      .read(key.split('/'))
      .then((blob) => {
        if (cancelled) return;
        created = URL.createObjectURL(blob);
        setUrl(created);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [backend, key]);

  return url ? (
    <img className="file-item__thumb" src={url} alt="" loading="lazy" draggable={false} />
  ) : (
    <Icon aria-hidden="true" />
  );
}
