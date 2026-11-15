// Boya kovası: tıklanan noktayla aynı (ya da çok yakın) renkteki bitişik alanı doldurur.
// Satır satır tarayan yığın tabanlı algoritma; büyük alanlarda da hızlıdır.

export function hexToRgba(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  const n = Number.parseInt(h.length === 3 ? [...h].map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

export function floodFill(
  image: ImageData,
  x: number,
  y: number,
  color: [number, number, number, number],
  tolerance = 32,
): boolean {
  const { width, height, data } = image;
  if (x < 0 || y < 0 || x >= width || y >= height) return false;
  const start = (y * width + x) * 4;
  const target = [data[start], data[start + 1], data[start + 2], data[start + 3]] as number[];
  if (target.every((v, i) => Math.abs(v - color[i]!) <= 2)) return false;

  const matches = (i: number) =>
    Math.abs(data[i]! - target[0]!) <= tolerance &&
    Math.abs(data[i + 1]! - target[1]!) <= tolerance &&
    Math.abs(data[i + 2]! - target[2]!) <= tolerance &&
    Math.abs(data[i + 3]! - target[3]!) <= tolerance;

  const seen = new Uint8Array(width * height);
  const stack: number[] = [x, y];
  while (stack.length) {
    const cy = stack.pop() as number;
    let cx = stack.pop() as number;
    // Satırın soluna kadar git
    while (cx > 0 && !seen[cy * width + cx - 1] && matches((cy * width + cx - 1) * 4)) cx--;
    let up = false;
    let down = false;
    for (; cx < width; cx++) {
      const p = cy * width + cx;
      if (seen[p] || !matches(p * 4)) break;
      seen[p] = 1;
      data.set(color, p * 4);
      for (const [ny, flagUp] of [
        [cy - 1, true],
        [cy + 1, false],
      ] as const) {
        if (ny < 0 || ny >= height) continue;
        const q = ny * width + cx;
        const ok = !seen[q] && matches(q * 4);
        const flag = flagUp ? up : down;
        if (ok && !flag) stack.push(cx, ny);
        if (flagUp) up = ok;
        else down = ok;
      }
    }
  }
  return true;
}
