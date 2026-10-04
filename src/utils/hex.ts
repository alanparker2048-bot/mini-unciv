import { HexCoord } from '../types';

export const GRID_COLS = 5;
export const GRID_ROWS = 7;
export const HEX_RADIUS = 36; // Optimized for mobile screen width (~360-420px)

export function isSameCoord(a: HexCoord | null | undefined, b: HexCoord | null | undefined): boolean {
  if (!a || !b) return false;
  return a.col === b.col && a.row === b.row;
}

// Convert odd-r offset coordinate to cube coordinate for accurate distance
export function offsetToCube(coord: HexCoord): { x: number; y: number; z: number } {
  const q = coord.col - (coord.row - (coord.row & 1)) / 2;
  const r = coord.row;
  return { x: q, y: -q - r, z: r };
}

// Exact distance between two hexes in an odd-r grid
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const ac = offsetToCube(a);
  const bc = offsetToCube(b);
  return Math.max(Math.abs(ac.x - bc.x), Math.abs(ac.y - bc.y), Math.abs(ac.z - bc.z));
}

// Get 6 direct neighbors in odd-r layout
export function getNeighbors(coord: HexCoord): HexCoord[] {
  const { col, row } = coord;
  const isOddRow = (row & 1) === 1;

  const offsets = isOddRow
    ? [
        { c: 0, r: -1 },
        { c: 1, r: -1 },
        { c: 1, r: 0 },
        { c: 1, r: 1 },
        { c: 0, r: 1 },
        { c: -1, r: 0 },
      ]
    : [
        { c: -1, r: -1 },
        { c: 0, r: -1 },
        { c: 1, r: 0 },
        { c: 0, r: 1 },
        { c: -1, r: 1 },
        { c: -1, r: 0 },
      ];

  return offsets
    .map((off) => ({ col: col + off.c, row: row + off.r }))
    .filter((c) => c.col >= 0 && c.col < GRID_COLS && c.row >= 0 && c.row < GRID_ROWS);
}

// Compute SVG pixel coordinates for pointy-topped hex center
export function hexToPixel(coord: HexCoord, radius: number = HEX_RADIUS): { x: number; y: number } {
  const width = Math.sqrt(3) * radius;
  const height = 2 * radius;
  const isOddRow = (coord.row & 1) === 1;

  const x = coord.col * width + (isOddRow ? width : width / 2) + 20; // 20px margin
  const y = coord.row * (height * 0.75) + radius + 15;

  return { x, y };
}

// Generate the 6 polygon vertex points for SVG <polygon points="..." />
export function getHexPolygonPoints(center: { x: number; y: number }, radius: number = HEX_RADIUS): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 30; // Pointy topped
    const angleRad = (Math.PI / 180) * angleDeg;
    const px = center.x + radius * Math.cos(angleRad);
    const py = center.y + radius * Math.sin(angleRad);
    points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return points.join(' ');
}
