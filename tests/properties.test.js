import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bfs, dijkstra, astar, MinHeap, WALL, WEIGHT } from '../algorithms.js';
import { seededRandom, obstacleMap, maze } from '../maps.js';
import { Playback } from '../playback.js';

// Independent Bellman–Ford oracle. Does not import neighbours, heap or result construction.
function oracle(grid, start, goal, weighted) {
  const rows = grid.length, cols = grid[0].length;
  const distances = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  distances[start.r][start.c] = 0;
  for (let pass = 0; pass < rows * cols - 1; pass++) {
    let changed = false;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (grid[r][c] === WALL || !Number.isFinite(distances[r][c])) continue;
      for (const [nr, nc] of [[r - 1, c], [r, c + 1], [r + 1, c], [r, c - 1]]) {
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] === WALL) continue;
        const candidate = distances[r][c] + (weighted && grid[nr][nc] === WEIGHT ? 5 : 1);
        if (candidate < distances[nr][nc]) { distances[nr][nc] = candidate; changed = true; }
      }
    }
    if (!changed) break;
  }
  return Number.isFinite(distances[goal.r][goal.c]) ? distances[goal.r][goal.c] : null;
}

function validatePath(result, grid, start, goal) {
  assert.equal(result.found, result.path.length > 0);
  const visited = new Set(result.visitedOrder.map(p => `${p.r},${p.c}`));
  assert.equal(visited.size, result.visitedCount, 'No cell expanded twice');
  for (const p of result.visitedOrder) assert.notEqual(grid[p.r][p.c], WALL);
  if (!result.found) { assert.equal(result.pathCost, null); assert.equal(result.steps, null); return; }
  assert.deepEqual(result.path[0], start);
  assert.deepEqual(result.path.at(-1), goal);
  assert.equal(result.steps, result.path.length - 1);
  let cost = 0;
  for (let i = 1; i < result.path.length; i++) {
    const p = result.path[i], prev = result.path[i - 1];
    assert.equal(Math.abs(p.r - prev.r) + Math.abs(p.c - prev.c), 1);
    assert.notEqual(grid[p.r][p.c], WALL);
    cost += grid[p.r][p.c] === WEIGHT ? 5 : 1;
  }
  assert.equal(result.pathCost, cost);
}

test('1,000 seeded grids match an independent Bellman–Ford oracle', () => {
  for (let seed = 0; seed < 1000; seed++) {
    const random = seededRandom(seed);
    const rows = 3 + Math.floor(random() * 6), cols = 3 + Math.floor(random() * 6);
    const start = { r: 0, c: 0 }, goal = { r: rows - 1, c: cols - 1 };
    const grid = obstacleMap(rows, cols, seed, start, goal);
    const before = JSON.stringify(grid);
    for (const solver of [bfs, dijkstra, astar]) {
      const result = solver(grid, start, goal);
      validatePath(result, grid, start, goal);
      assert.equal(solver === bfs ? result.steps : result.pathCost, oracle(grid, start, goal, solver !== bfs), `Seed ${seed}, ${solver.name}`);
    }
    assert.equal(JSON.stringify(grid), before, 'Search must not mutate input');
  }
});

test('uniform-cost grids give all searches the same optimum', () => {
  for (let seed = 0; seed < 100; seed++) {
    const start = { r: 0, c: 0 }, goal = { r: 7, c: 8 };
    const grid = obstacleMap(8, 9, seed, start, goal).map(row => row.map(value => value === WEIGHT ? 0 : value));
    assert.equal(bfs(grid, start, goal).pathCost, dijkstra(grid, start, goal).pathCost);
    assert.equal(astar(grid, start, goal).pathCost, dijkstra(grid, start, goal).pathCost);
  }
});

test('malformed grids, points and unsupported cell costs are rejected', () => {
  for (const solver of [bfs, dijkstra, astar]) {
    for (const grid of [null, [], [null], [[]], [[0], [0, 0]], [[-1]], [[2]], [[NaN]], [['0']]]) {
      assert.throws(() => solver(grid, { r: 0, c: 0 }, { r: 0, c: 0 }), TypeError);
    }
    for (const point of [null, undefined, {}, { r: 0.5, c: 0 }, { r: -1, c: 0 }, { r: 1, c: 0 }]) {
      assert.throws(() => solver([[0]], point, { r: 0, c: 0 }), RangeError);
    }
  }
});

test('single rows, single columns and weighted endpoints', () => {
  for (const solver of [bfs, dijkstra, astar]) {
    assert.equal(solver([[5, 0, 5]], { r: 0, c: 0 }, { r: 0, c: 2 }).pathCost, 6);
    assert.equal(solver([[5], [0], [5]], { r: 0, c: 0 }, { r: 2, c: 0 }).pathCost, 6);
    assert.equal(solver([[5]], { r: 0, c: 0 }, { r: 0, c: 0 }).pathCost, 0);
    assert.equal(solver([[0, 1, 0]], { r: 0, c: 0 }, { r: 0, c: 2 }).pathCost, null);
  }
});

test('heap matches sorted reference during 10,000 interleaved operations', () => {
  const random = seededRandom('heap');
  const heap = new MinHeap(), reference = [];
  let order = 0;
  for (let i = 0; i < 10000; i++) {
    if (random() < .62) {
      const item = { priority: Math.floor(random() * 20) - 10, order: order++ };
      heap.push(item); reference.push(item);
      reference.sort((a, b) => a.priority - b.priority || a.order - b.order);
    } else { assert.deepEqual(heap.pop(), reference.shift()); }
    assert.equal(heap.length, reference.length);
  }
  while (reference.length) assert.deepEqual(heap.pop(), reference.shift());
  assert.equal(heap.pop(), undefined);
  for (const priority of [NaN, Infinity, -Infinity, '3']) assert.throws(() => heap.push({ priority }), TypeError);
});

test('seeded maps reproduce exactly and preserve endpoints', () => {
  const start = { r: 0, c: 0 }, goal = { r: 8, c: 8 };
  assert.deepEqual(obstacleMap(9, 9, 'same', start, goal), obstacleMap(9, 9, 'same', start, goal));
  assert.notDeepEqual(obstacleMap(9, 9, 'same', start, goal), obstacleMap(9, 9, 'other', start, goal));
  assert.deepEqual(maze(9, 9, 'same', start, goal), maze(9, 9, 'same', start, goal));
});

test('200 mazes are connected across odd/even sizes and arbitrary endpoints', () => {
  for (let seed = 0; seed < 200; seed++) {
    const random = seededRandom(seed);
    const rows = 3 + Math.floor(random() * 18), cols = 3 + Math.floor(random() * 28);
    const start = { r: Math.floor(random() * rows), c: Math.floor(random() * cols) };
    const goal = { r: Math.floor(random() * rows), c: Math.floor(random() * cols) };
    const grid = maze(rows, cols, seed, start, goal);
    const result = bfs(grid, start, goal);
    assert.ok(result.found, `Maze seed ${seed}`);
    validatePath(result, grid, start, goal);
    const reachable = bfs(grid, start, start); // Endpoint invariant, including start===goal.
    assert.equal(reachable.pathCost, 0);
  }
});

test('map generators validate inputs', () => {
  for (const generator of [maze, obstacleMap]) {
    assert.throws(() => generator(2, 10, 'x', { r: 0, c: 0 }, { r: 0, c: 1 }), RangeError);
    assert.throws(() => generator(10, 10, 'x', null, { r: 0, c: 1 }), RangeError);
    assert.throws(() => generator(201, 10, 'x', { r: 0, c: 0 }, { r: 0, c: 1 }), RangeError);
  }
});

test('playback supports pause, resume, step, completion and cancellation', () => {
  const playback = new Playback();
  const result = bfs([[0, 0, 0]], { r: 0, c: 0 }, { r: 0, c: 2 });
  assert.equal(playback.tick(), null);
  playback.load(result);
  assert.equal(playback.state, 'paused');
  playback.play(); assert.ok(playback.tick());
  playback.pause(); const index = playback.index;
  assert.equal(playback.tick(), null); assert.equal(playback.index, index);
  assert.ok(playback.step()); assert.equal(playback.state, 'paused');
  playback.play(); while (playback.tick()) { /* drain */ }
  assert.equal(playback.state, 'complete'); assert.equal(playback.index, playback.events.length);
  playback.load(result); playback.play(); playback.reset();
  assert.equal(playback.tick(), null); assert.equal(playback.state, 'idle');
});
