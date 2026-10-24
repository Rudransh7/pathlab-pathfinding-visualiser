/** Reproducible map generation. No global Math.random or hidden mutable state. */
import { EMPTY, WALL, WEIGHT } from './algorithms.js';

export function seededRandom(seed) {
  let state = 2166136261;
  for (const char of String(seed)) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function dimensions(rows, cols, start, goal) {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 3 || cols < 3 || rows > 200 || cols > 200) {
    throw new RangeError('Map dimensions must be integers from 3 to 200');
  }
  for (const point of [start, goal]) {
    if (!point || !Number.isInteger(point.r) || !Number.isInteger(point.c) || point.r < 0 || point.c < 0 || point.r >= rows || point.c >= cols) {
      throw new RangeError('Endpoints must be inside the map');
    }
  }
}

export function obstacleMap(rows, cols, seed, start, goal) {
  dimensions(rows, cols, start, goal);
  const random = seededRandom(seed);
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => {
    const value = random();
    return value < .23 ? WALL : value < .36 ? WEIGHT : EMPTY;
  }));
  grid[start.r][start.c] = EMPTY; grid[goal.r][goal.c] = EMPTY;
  return grid;
}

/** Iterative randomised depth-first carving. O(rows*cols), guaranteed connected passages. */
export function maze(rows, cols, seed, start, goal) {
  dimensions(rows, cols, start, goal);
  const random = seededRandom(seed);
  const grid = Array.from({ length: rows }, () => Array(cols).fill(WALL));
  const stack = [{ r: 1, c: 1 }];
  grid[1][1] = EMPTY;
  while (stack.length) {
    const current = stack[stack.length - 1];
    const options = [[-2, 0], [0, 2], [2, 0], [0, -2]]
      .map(([dr, dc]) => ({ r: current.r + dr, c: current.c + dc }))
      .filter(p => p.r > 0 && p.c > 0 && p.r < rows - 1 && p.c < cols - 1 && grid[p.r][p.c] === WALL);
    if (!options.length) { stack.pop(); continue; }
    const next = options[Math.floor(random() * options.length)];
    grid[(current.r + next.r) / 2][(current.c + next.c) / 2] = EMPTY;
    grid[next.r][next.c] = EMPTY;
    stack.push(next);
  }
  // Connect arbitrary user-placed endpoints to the nearest odd interior passage.
  for (const point of [start, goal]) {
    const r = Math.max(1, Math.min(rows - 2, point.r));
    const c = Math.max(1, Math.min(cols - 2, point.c));
    const target = { r: r % 2 ? r : r - 1, c: c % 2 ? c : c - 1 };
    let row = point.r, col = point.c;
    grid[row][col] = EMPTY;
    while (row !== target.r) { row += Math.sign(target.r - row); grid[row][col] = EMPTY; }
    while (col !== target.c) { col += Math.sign(target.c - col); grid[row][col] = EMPTY; }
  }
  return grid;
}
