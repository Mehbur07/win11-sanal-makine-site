// Cihaz modu: arayüz ekran boyutuna ve dokunmatik olup olmamasına göre üç şekilde davranır.
//  - desktop: fare ile kullanım, pencereler serbest
//  - tablet:  dokunmatik büyük ekran; büyük dokunma alanları, yan yana bölme düğmesi
//  - phone:   küçük ekran; uygulamalar tam ekran, masaüstü ana ekran gibi
export type DeviceMode = 'desktop' | 'tablet' | 'phone';

export const PHONE_MAX_SHORT_SIDE = 600;

export function detectMode(width: number, height: number, coarsePointer: boolean): DeviceMode {
  if (Math.min(width, height) < PHONE_MAX_SHORT_SIDE) return 'phone';
  if (coarsePointer) return 'tablet';
  return 'desktop';
}

// Moda göre ölçüler (px). CSS'teki --title-h ve --panel-h ile aynı tutulmalı.
export const METRICS: Record<DeviceMode, { titleH: number; panelH: number }> = {
  desktop: { titleH: 40, panelH: 52 },
  tablet: { titleH: 48, panelH: 60 },
  phone: { titleH: 52, panelH: 60 },
};
