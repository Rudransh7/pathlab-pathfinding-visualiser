import { runAlgorithm, EMPTY, WALL, WEIGHT } from './algorithms.js';
const $ = (id) => document.getElementById(id);
const ROWS = 18, COLS = 31;
let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
let start = { r: 9, c: 5 }, goal = { r: 9, c: 25 };
let tool = 'wall', algorithm = 'astar', drag = false, runToken = 0;
const tiles = [];
const names = { bfs: 'Breadth-First Search', dijkstra: "Dijkstra's Algorithm", astar: 'A* Search' };
const descriptions = {
  bfs: 'Breadth-first search explores neighbours layer by layer using a queue. It finds the path with the fewest steps, but on weighted maps that route may cost more.',
  dijkstra: 'Dijkstra uses a priority queue to repeatedly visit the node with the cheapest known distance from the start. It produces an optimal weighted path for non-negative costs.',
  astar: 'A* combines cost travelled so far with a Manhattan-distance estimate of the remaining journey. With this admissible heuristic it finds a minimum-cost path.',
};
const eq = (a, b) => a.r === b.r && a.c === b.c;
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const coord = (r, c) => `${r},${c}`;

function build() {
  $('grid').style.gridTemplateColumns = `repeat(${COLS}, minmax(0, 1fr))`;
  const fragment = document.createDocumentFragment();
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'cell'; el.dataset.r = r; el.dataset.c = c;
      el.setAttribute('role', 'gridcell');
      el.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; drag = true; draw(r, c); });
      el.addEventListener('pointerenter', () => { if (drag) draw(r, c); });
      row.push(el); fragment.append(el);
    }
    tiles.push(row);
  }
  $('grid').append(fragment);
  window.addEventListener('pointerup', () => { drag = false; });
  $('grid').addEventListener('dragstart', e => e.preventDefault());
  redraw();
}

function redraw() {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const el = tiles[r][c];
    const type = eq({r,c}, start) ? 'start' : eq({r,c}, goal) ? 'goal' : grid[r][c] === WALL ? 'wall' : grid[r][c] === WEIGHT ? 'weight' : '';
    el.className = `cell ${type}`;
    el.textContent = type === 'start' ? 'S' : type === 'goal' ? 'G' : type === 'weight' ? '5' : '';
    el.setAttribute('aria-label', `Row ${r+1}, column ${c+1}: ${type || 'empty'}`);
  }
}

function draw(r, c) {
  ++runToken;
  if (tool === 'start' && !eq({r,c}, goal)) { grid[start.r][start.c] = EMPTY; start = {r,c}; grid[r][c] = EMPTY; }
  else if (tool === 'goal' && !eq({r,c}, start)) { grid[goal.r][goal.c] = EMPTY; goal = {r,c}; grid[r][c] = EMPTY; }
  else if (!eq({r,c}, start) && !eq({r,c}, goal)) {
    grid[r][c] = tool === 'wall' ? WALL : tool === 'weight' ? WEIGHT : tool === 'erase' ? EMPTY : grid[r][c];
  }
  redraw(); $('status').textContent = 'Grid edited — ready to visualise.';
}

function setTool(value) {
  tool = value;
  document.querySelectorAll('[data-tool]').forEach(el => el.classList.toggle('active', el.dataset.tool === value));
}
function setAlgorithm(value) {
  algorithm = value;
  ++runToken; redraw();
  document.querySelectorAll('[data-alg]').forEach(el => el.classList.toggle('active', el.dataset.alg === value));
  $('algorithm-label').textContent = names[value]; $('explain-title').textContent = names[value];
  $('explain-copy').textContent = descriptions[value];
}

async function animate(points, kind, token, interval) {
  for (let i = 0; i < points.length; i++) {
    if (runToken !== token) return false;
    const p = points[i];
    if (!eq(p, start) && !eq(p, goal)) {
      tiles[p.r][p.c].classList.add(kind);
      if (kind === 'path') tiles[p.r][p.c].textContent = '';
    }
    if (i % 2 === 0) await pause(interval);
  }
  return runToken === token;
}

async function visualise() {
  const token = ++runToken;
  redraw();
  const startTime = performance.now();
  const result = runAlgorithm(algorithm, grid, start, goal);
  const duration = performance.now() - startTime;
  $('visited').textContent = result.visitedCount;
  $('steps').textContent = result.steps ?? 'No path';
  $('cost').textContent = result.path.length ? result.pathCost : '—';
  $('elapsed').textContent = `${duration.toFixed(2)} ms`;
  $('status').textContent = `Exploring with ${names[algorithm]}…`;
  const interval = 47 - Number($('speed').value) * 4;
  if (!(await animate(result.visitedOrder, 'visited', token, interval))) return;
  if (!(await animate(result.path, 'path', token, Math.max(interval * 2, 4)))) return;
  $('status').textContent = result.path.length ? `Complete — path found in ${result.steps} steps with cost ${result.pathCost}.` : 'No route exists. Remove a few walls and try again.';
}
function randomise() {
  ++runToken;
  grid = Array.from({length: ROWS}, (_, r) => Array.from({length: COLS}, (_, c) => {
    if (eq({r,c}, start) || eq({r,c}, goal)) return EMPTY;
    const p = Math.random(); return p < .23 ? WALL : p < .34 ? WEIGHT : EMPTY;
  }));
  redraw(); $('status').textContent = 'Random obstacles generated — run an algorithm.';
}
function clear() {
  ++runToken; grid = Array.from({length: ROWS}, () => Array(COLS).fill(EMPTY));
  start = {r:9,c:5}; goal = {r:9,c:25};
  redraw();
  ['visited','steps','cost','elapsed'].forEach(id => { $(id).textContent = '—'; });
  $('status').textContent = 'Grid cleared.';
}
document.querySelectorAll('[data-tool]').forEach(el => el.addEventListener('click', () => setTool(el.dataset.tool)));
document.querySelectorAll('[data-alg]').forEach(el => el.addEventListener('click', () => setAlgorithm(el.dataset.alg)));
$('run').addEventListener('click', visualise);
$('random').addEventListener('click', randomise);
$('clear').addEventListener('click', clear);
$('speed').addEventListener('input', () => { $('speed-label').textContent = `${$('speed').value}/10`; });
build();
// An accessible demonstration map, with a visible gap and weighted alternatives.
for (let r = 3; r < 15; r++) if (r !== 7 && r !== 13) grid[r][15] = WALL;
for (let c = 10; c < 15; c++) grid[12][c] = WEIGHT;
redraw();
