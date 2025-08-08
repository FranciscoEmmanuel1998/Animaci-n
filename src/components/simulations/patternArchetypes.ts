// Pattern archetypes for complex injections into the cellular universe.
// Coordinates are relative (row, col) with (0,0) top-left.
export interface Pattern {
  name: string;
  cells: Array<[number, number]>; // positions of live cells
  width: number;
  height: number;
  rarity: number; // lower => rarer
}

// Utility to build pattern from ASCII shape
const shape = (name: string, ascii: string[], rarity = 1): Pattern => {
  const cells: Array<[number, number]> = [];
  ascii.forEach((line, r) => {
    [...line].forEach((ch, c) => { if (ch === 'O' || ch === '1' || ch === 'X') cells.push([r, c]); });
  });
  return { name, cells, width: ascii[0].length, height: ascii.length, rarity };
};

// Selected archetypes (classic + custom composites)
export const PATTERNS: Pattern[] = [
  // Glider
  shape('Glider', [
    '.O.',
    '..O',
    'OOO'
  ], 0.2),
  // Lightweight spaceship
  shape('LWSS', [
    '.O..O',
    'O....',
    'O...O',
    'OOOO.'
  ], 0.1),
  // Pulsar (period 3 oscillator)
  shape('PulsarCore', [
    '..OOO...OOO..',
    '.............',
    'O....O.O....O',
    'O....O.O....O',
    'O....O.O....O',
    '..OOO...OOO..',
    '.............',
    '..OOO...OOO..',
    'O....O.O....O',
    'O....O.O....O',
    'O....O.O....O',
    '.............',
    '..OOO...OOO..'
  ], 0.05),
  // Gosper Glider Gun (trimmed)
  shape('GosperGun', [
    '........................O...........',
    '......................O.O...........',
    '............OO......OO............OO',
    '...........O...O....OO............OO',
    'OO........O.....O...OO..............',
    'OO........O...O.OO....O.O...........',
    '..........O.....O.......O...........',
    '...........O...O....................',
    '............OO......................'
  ], 0.02),
  // Custom spiral seed
  shape('SpiralSeed', [
    '...O...',
    '..OOO..',
    '.OO.OO.',
    'OO...OO',
    '.OO.OO.',
    '..OOO..',
    '...O...'
  ], 0.15),
  // Custom nova cluster
  shape('NovaCluster', [
    '..O..',
    '.O.O.',
    'O...O',
    '.O.O.',
    '..O..'
  ], 0.25)
];

export const pickPatternByRarity = (bias = Math.random()): Pattern => {
  // Weighted inverse rarity
  const weights = PATTERNS.map(p => 1 / p.rarity);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = bias * total;
  for (let i = 0; i < PATTERNS.length; i++) {
    t -= weights[i];
    if (t <= 0) return PATTERNS[i];
  }
  return PATTERNS[PATTERNS.length - 1];
};

export function stampPattern(grid: number[][], pattern: Pattern, top: number, left: number) {
  const rows = grid.length; const cols = grid[0].length;
  for (const [r, c] of pattern.cells) {
    const rr = (top + r + rows) % rows;
    const cc = (left + c + cols) % cols;
    grid[rr][cc] = 1;
  }
}

// Quick diversity metric helper: counts variety of local 3x3 sums
export function sampleNeighborhoodSignature(grid: number[][], samples: number) {
  const rows = grid.length; const cols = grid[0].length;
  const bucket = new Uint16Array(10);
  for (let s = 0; s < samples; s++) {
    const r = Math.floor(Math.random()*rows);
    const c = Math.floor(Math.random()*cols);
    let sum = 0;
    for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) {
      const rr = (r+dr+rows)%rows; const cc = (c+dc+cols)%cols;
      sum += grid[rr][cc];
    }
    bucket[sum]++;
  }
  let distinct = 0; for (let i=0;i<bucket.length;i++) if(bucket[i]) distinct++;
  return { distinct, bucket };
}
