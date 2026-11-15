import { fileType, isTextLike } from './files/fileTypes.ts';
import type { AppId } from './types.ts';

// Bir dosyayı hangi uygulamanın açacağı: metin → Metin Düzenleyici, resim → Fotoğraflar.
// Uygun uygulama yoksa null (Dosyalar önizleme/indirme sunar).
export function appForFile(name: string): AppId | null {
  const type = fileType(name, 'file');
  if (isTextLike(type)) return 'editor';
  if (type === 'image') return 'photos';
  return null;
}
