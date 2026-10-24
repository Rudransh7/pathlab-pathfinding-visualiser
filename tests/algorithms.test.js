import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bfs, dijkstra, astar, MinHeap, neighbours, manhattan, runAlgorithm, WALL, WEIGHT } from '../algorithms.js';

const start = { r: 0, c: 0 }, goal = { r: 0, c: 2 };

test('BFS finds the shortest number of hops', () => {
  const result = bfs([[0, 0, 0], [0, 0, 0]], start, goal);
  assert.equal(result.steps, 2);
  assert.deepEqual(result.path[0], start);
  assert.deepEqual(result.path.at(-1), goal);
});

test('weighted shortest paths avoid an expensive shortcut', () => {
  const grid = [[0, WEIGHT, 0], [0, 0, 0]];
  const unweighted = bfs(grid, start, goal);
  const byCost = dijkstra(grid, start, goal);
  assert.equal(unweighted.steps, 2);
  assert.equal(unweighted.pathCost, 6);
  assert.equal(byCost.pathCost, 4);
  assert.equal(byCost.steps, 4);
  assert.deepEqual(astar(grid, start, goal).pathCost, byCost.pathCost);
});

test('all algorithms recognise no available path', () => {
  const grid = [[0, WALL, 0], [0, WALL, 0]];
  for (const solver of [bfs, dijkstra, astar]) {
    const result = solver(grid, start, goal);
    assert.deepEqual(result.path, []);
    assert.equal(result.steps, null);
  }
});

test('start equals finish', () => {
  for (const solver of [bfs, dijkstra, astar]) {
    const result = solver([[0]], { r: 0, c: 0 }, { r: 0, c: 0 });
    assert.equal(result.steps, 0);
    assert.equal(result.pathCost, 0);
  }
});

test('neighbours do not cross walls or borders', () => {
  assert.deepEqual(neighbours([[0, WALL], [0, 0]], start), [{r: 1, c: 0}]);
  assert.equal(manhattan(start, {r: 2, c: 3}), 5);
});

test('invalid grids and locations are rejected', () => {
  assert.throws(() => bfs([], start, goal), TypeError);
  assert.throws(() => bfs([[0, 0], [0]], start, goal), TypeError);
  assert.throws(() => bfs([[WALL, 0, 0]], start, goal), RangeError);
  assert.throws(() => runAlgorithm('dfs', [[0]], start, start), RangeError);
});

test('min heap orders priorities', () => {
  const heap = new MinHeap();
  [8, 3, 9, 1, 4, 1].forEach(priority => heap.push({priority}));
  assert.deepEqual(Array.from({length: 6}, () => heap.pop().priority), [1,1,3,4,8,9]);
  assert.equal(heap.pop(), undefined);
});

test('A* matches Dijkstra cost across deterministic maps', () => {
  for (let seed = 1; seed <= 20; seed++) {
    let state = seed;
    const random = () => { state = (1664525 * state + 1013904223) >>> 0; return state / (2 ** 32); };
    const grid = Array.from({length: 12}, () => Array.from({length: 15}, () => {
      const p = random(); return p < .19 ? WALL : p < .35 ? WEIGHT : 0;
    }));
    grid[0][0] = 0; grid[11][14] = 0;
    const a = astar(grid, {r:0,c:0}, {r:11,c:14});
    const d = dijkstra(grid, {r:0,c:0}, {r:11,c:14});
    assert.equal(a.pathCost, d.pathCost);
    assert.equal(a.steps === null, d.steps === null);
  }
});
