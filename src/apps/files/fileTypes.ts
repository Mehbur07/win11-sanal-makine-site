import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  type LucideIcon,
} from 'lucide-react';
import { extOf } from '../../storage/names.ts';
import type { EntryKind } from '../../storage/types.ts';

export type FileType =
  'folder' | 'image' | 'text' | 'code' | 'audio' | 'video' | 'archive' | 'other';

const BY_EXT: Record<string, FileType> = {};
const add = (type: FileType, exts: string) => exts.split(' ').forEach((e) => (BY_EXT[e] = type));
add('image', 'png jpg jpeg gif webp bmp svg avif ico');
add('text', 'txt md log csv ini cfg rtf');
add('code', 'json js ts tsx jsx html css xml yml yaml py java c cpp h sh bat ps1 toml');
add('audio', 'mp3 wav ogg m4a flac aac');
add('video', 'mp4 webm mkv mov avi');
add('archive', 'zip rar 7z tar gz');

export function fileType(name: string, kind: EntryKind): FileType {
  if (kind === 'dir') return 'folder';
  return BY_EXT[extOf(name)] ?? 'other';
}

export const TYPE_ICON: Record<FileType, { icon: LucideIcon; color: string }> = {
  folder: { icon: Folder, color: '#FFC25A' },
  image: { icon: FileImage, color: '#7CF5B4' },
  text: { icon: FileText, color: '#8AF3FF' },
  code: { icon: FileCode, color: '#2DE2F5' },
  audio: { icon: FileAudio, color: '#FF7AD0' },
  video: { icon: FileVideo, color: '#FF2DAA' },
  archive: { icon: FileArchive, color: '#FFC25A' },
  other: { icon: File, color: '#8FA9B0' },
};

/** Önizlemede metin olarak gösterilecek türler */
export function isTextLike(type: FileType): boolean {
  return type === 'text' || type === 'code';
}

export function formatSize(bytes: number, locale: string): string {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: units[i],
    unitDisplay: 'short',
    maximumFractionDigits: i === 0 ? 0 : 1,
  }).format(value);
}

export function formatDate(ms: number, locale: string): string {
  if (!ms) return '';
  return new Date(ms).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Tarayıcıya "bu dosyayı indir" dedirtir */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
