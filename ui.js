import { runAlgorithm, EMPTY, WALL, WEIGHT } from './algorithms.js';
import { maze, obstacleMap } from './maps.js';
import { Playback } from './playback.js';

const $ = (id) => document.getElementById(id);
const ROWS = 19, COLS = 31;
const names = { bfs: 'Breadth-First Search', dijkstra: "Dijkstra's Algorithm", astar: 'A* Search' };
const descriptions = {
  bfs: 'A FIFO queue explores one distance layer at a time. The first discovered route has the fewest steps. Weights do not affect exploration, so this route can cost more. Time O(V + E); memory O(V).',
  dijkstra: 'A binary min-heap selects the cheapest known route so far. Each move adds the cost of entering its destination cell. Stale heap entries are skipped. For this grid, time O((V + E) log V); memory O(V).',
  astar: 'A* orders the heap by f = g + h: cost so far plus Manhattan distance. Each cardinal move costs at least 1, so h never overestimates and is consistent. This makes closing expanded cells safe. Worst-case grid bounds match Dijkstra; fewer expansions are not guaranteed.',
};
let grid, start, goal;
let tool = 'wall', algorithm = 'astar', drag = false;
let focus = { r: 9, c: 3 };
let frame = 0, lastTime = 0, credit = 0, result = null;
const playback = new Playback();
const tiles = [];
const eq = (a, b) => a.r === b.r && a.c === b.c;

function build() {
  $('grid').setAttribute('aria-rowcount', ROWS);
  $('grid').setAttribute('aria-colcount', COLS);
  for (let r = 0; r < ROWS; r++) {
    const row = document.createElement('div');
    row.className = 'grid-row'; row.setAttribute('role', 'row');
    const cells = [];
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('button');
      cell.type = 'button'; cell.className = 'cell'; cell.dataset.r = r; cell.dataset.c = c;
      cell.setAttribute('role', 'gridcell'); cell.setAttribute('aria-colindex', c + 1); cell.setAttribute('aria-rowindex', r + 1);
      cell.tabIndex = eq({ r, c }, focus) ? 0 : -1;
      cell.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        drag = true; moveFocus(r, c, false); draw(r, c);
      });
      cell.addEventListener('pointerenter', (event) => { if (drag && event.buttons === 1) draw(r, c); });
      cell.addEventListener('click', (event) => { if (event.detail === 0) draw(r, c); });
      cell.addEventListener('keydown', (event) => {
        const moves = { ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowDown: [1, 0], ArrowLeft: [0, -1] };
        if (moves[event.key]) {
          event.preventDefault();
          const [dr, dc] = moves[event.key];
          moveFocus(Math.max(0, Math.min(ROWS - 1, r + dr)), Math.max(0, Math.min(COLS - 1, c + dc)));
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault(); moveFocus(r, event.key === 'Home' ? 0 : COLS - 1);
        }
      });
      cells.push(cell); row.append(cell);
    }
    tiles.push(cells); $('grid').append(row);
  }
  window.addEventListener('pointerup', () => { drag = false; });
  window.addEventListener('pointercancel', () => { drag = false; });
  window.addEventListener('blur', () => { drag = false; });
  $('grid').addEventListener('dragstart', event => event.preventDefault());
}

function moveFocus(r, c, activate = true) {
  tiles[focus.r][focus.c].tabIndex = -1;
  focus = { r, c }; tiles[r][c].tabIndex = 0;
  if (activate) tiles[r][c].focus();
}

function redraw() {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cell = tiles[r][c];
    const type = eq({ r, c }, start) ? 'start' : eq({ r, c }, goal) ? 'goal' : grid[r][c] === WALL ? 'wall' : grid[r][c] === WEIGHT ? 'weight' : 'empty';
    cell.className = `cell ${type}`;
    cell.textContent = type === 'start' ? 'S' : type === 'goal' ? 'G' : type === 'weight' ? '5' : '';
    cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}: ${type === 'weight' ? 'weight, cost 5' : type}`);
  }
}

function cancel(clearMetrics = true) {
  cancelAnimationFrame(frame); frame = 0; credit = 0;
  playback.reset(); result = null;
  if (clearMetrics) {
    for (const id of ['visited', 'steps', 'cost', 'elapsed']) $(id).textContent = '—';
    $('comparison').hidden = true;
  }
  redraw(); updateControls();
}

function draw(r, c) {
  cancel();
  if (tool === 'start' && !eq({ r, c }, goal)) { start = { r, c }; grid[r][c] = EMPTY; }
  else if (tool === 'goal' && !eq({ r, c }, start)) { goal = { r, c }; grid[r][c] = EMPTY; }
  else if (!eq({ r, c }, start) && !eq({ r, c }, goal) && !['start', 'goal'].includes(tool)) {
    grid[r][c] = tool === 'wall' ? WALL : tool === 'weight' ? WEIGHT : EMPTY;
  }
  redraw(); $('status').textContent = 'Grid edited. Results cleared; ready to search.';
}

function setTool(value) {
  tool = value;
  document.querySelectorAll('[data-tool]').forEach(el => {
    const active = el.dataset.tool === value;
    el.classList.toggle('active', active); el.setAttribute('aria-pressed', active);
  });
}

function setAlgorithm(value) {
  algorithm = value; cancel();
  document.querySelectorAll('[data-alg]').forEach(el => {
    const active = el.dataset.alg === value;
    el.classList.toggle('active', active); el.setAttribute('aria-pressed', active);
  });
  $('algorithm-label').textContent = names[value]; $('explain-title').textContent = names[value];
  $('explain-copy').textContent = descriptions[value];
  $('status').textContent = `${names[value]} selected. Ready to search.`;
}

function updateControls() {
  $('pause').disabled = !['running', 'paused'].includes(playback.state);
  $('pause').textContent = playback.state === 'running' ? 'Pause' : 'Resume';
  $('step').disabled = playback.state === 'running' || playback.state === 'complete';
  $('progress').textContent = `${playback.index} / ${playback.events.length} animation events`;
}

function prepare() {
  cancel();
  const before = performance.now();
  result = runAlgorithm(algorithm, grid, start, goal);
  $('elapsed').textContent = `${(performance.now() - before).toFixed(2)} ms`;
  $('visited').textContent = result.visitedCount;
  $('steps').textContent = result.steps ?? 'No path';
  $('cost').textContent = result.pathCost ?? '—';
  playback.load(result); updateControls();
}

function show(event) {
  if (!event) return;
  const { point, kind } = event;
  if (!eq(point, start) && !eq(point, goal)) tiles[point.r][point.c].classList.add(kind);
  // Keep weight labels visible, even on the final route.
}

function completion() {
  $('status').textContent = result.found
    ? `Complete — ${result.steps} steps, cost ${result.pathCost}, ${result.visitedCount} cells expanded.${algorithm === 'bfs' ? ' BFS minimises steps, not weighted cost.' : ''}`
    : `No route exists. ${result.visitedCount} reachable cells expanded. Try removing walls.`;
  updateControls();
}

function animate(time) {
  if (playback.state !== 'running') return;
  credit += Math.min(time - lastTime, 100); lastTime = time;
  const interval = 105 - Number($('speed').value) * 10;
  while (credit >= interval && playback.state === 'running') { show(playback.tick()); credit -= interval; }
  updateControls();
  if (playback.state === 'complete') completion();
  else frame = requestAnimationFrame(animate);
}

function play() {
  playback.play(); lastTime = performance.now(); credit = 0;
  $('status').textContent = `Exploring with ${names[algorithm]}…`;
  updateControls(); frame = requestAnimationFrame(animate);
}

function visualise() {
  prepare();
  if ($('instant').checked) {
    while (playback.index < playback.events.length) show(playback.step());
    completion();
  } else play();
}

function step() {
  if (playback.state === 'idle') prepare();
  show(playback.step()); updateControls();
  if (playback.state === 'complete') completion();
  else $('status').textContent = 'Paused. Step advances one visited or path cell.';
}

function resetMap(kind) {
  if (kind === 'clear' || kind === 'demo') {
    start = { r: 9, c: 3 }; goal = { r: 9, c: 27 };
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
    if (kind === 'demo') for (let c = 8; c <= 22; c++) grid[9][c] = WEIGHT;
  } else {
    const seed = $('seed').value.trim() || '2027'; $('seed').value = seed;
    grid = (kind === 'maze' ? maze : obstacleMap)(ROWS, COLS, seed, start, goal);
  }
  cancel();
  $('status').textContent = kind === 'demo' ? 'Weighted shortcut: compare fewest steps with lowest cost.'
    : kind === 'maze' ? `Connected maze generated with seed “${$('seed').value}”.`
      : kind === 'random' ? `Obstacle map generated with seed “${$('seed').value}”. A route is not guaranteed.` : 'Grid cleared.';
}

function compare() {
  cancel();
  const body = $('comparison-rows'); body.replaceChildren();
  for (const name of Object.keys(names)) {
    const times = []; let comparisonResult;
    for (let repeat = 0; repeat < 9; repeat++) {
      const before = performance.now(); comparisonResult = runAlgorithm(name, grid, start, goal); times.push(performance.now() - before);
    }
    times.sort((a, b) => a - b);
    const row = document.createElement('tr');
    for (const value of [names[name], comparisonResult.visitedCount, comparisonResult.steps ?? 'No path', comparisonResult.pathCost ?? '—', `${times[4].toFixed(2)} ms`]) {
      const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
    }
    body.append(row);
  }
  $('comparison').hidden = false;
  $('status').textContent = 'Compared all three algorithms on the same grid. Timings exclude animation and are approximate.';
}

document.querySelectorAll('[data-tool]').forEach(el => el.addEventListener('click', () => setTool(el.dataset.tool)));
document.querySelectorAll('[data-alg]').forEach(el => el.addEventListener('click', () => setAlgorithm(el.dataset.alg)));
$('run').addEventListener('click', visualise);
$('pause').addEventListener('click', () => {
  if (playback.state === 'running') {
    playback.pause(); cancelAnimationFrame(frame); updateControls(); $('status').textContent = 'Paused. Resume or advance one step.';
  } else if (playback.state === 'paused') play();
});
$('step').addEventListener('click', step);
$('reset-search').addEventListener('click', () => { cancel(); $('status').textContent = 'Search reset. Your grid is unchanged.'; });
for (const id of ['random', 'maze', 'clear', 'demo']) $(id).addEventListener('click', () => resetMap(id));
$('compare').addEventListener('click', compare);
$('speed').addEventListener('input', () => { $('speed-label').textContent = `${$('speed').value}/10`; });
$('instant').checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
build(); resetMap('demo'); setTool('wall'); setAlgorithm('astar');
