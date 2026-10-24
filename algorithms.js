/** Pure, dependency-free graph algorithms. A cell is 0 (normal), 1 (wall) or 5 (costly). */
export const EMPTY = 0;
export const WALL = 1;
export const WEIGHT = 5;

export function neighbours(grid, { r, c }) {
  const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  return directions.map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
    .filter(({ r: nr, c: nc }) => nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length && grid[nr][nc] !== WALL);
}

export function manhattan(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

const key = ({ r, c }) => `${r},${c}`;

function validate(grid, start, goal) {
  if (!Array.isArray(grid) || !grid.length || !grid[0].length || !grid.every(row => Array.isArray(row) && row.length === grid[0].length)) {
    throw new TypeError('Grid must be a nonempty rectangle');
  }
  for (const point of [start, goal]) {
    if (!Number.isInteger(point.r) || !Number.isInteger(point.c) || point.r < 0 || point.c < 0 || point.r >= grid.length || point.c >= grid[0].length || grid[point.r][point.c] === WALL) {
      throw new RangeError('Start and finish must be on traversable cells');
    }
  }
}

function finishResult(goal, start, parents, visitedOrder, grid) {
  const path = [];
  if (key(goal) === key(start) || parents.has(key(goal))) {
    let current = goal;
    while (current) {
      path.push(current);
      if (key(current) === key(start)) break;
      current = parents.get(key(current));
    }
    path.reverse();
  }
  const pathCost = path.slice(1).reduce((sum, p) => sum + (grid[p.r][p.c] === WEIGHT ? WEIGHT : 1), 0);
  return { path, visitedOrder, pathCost, visitedCount: visitedOrder.length, steps: path.length ? path.length - 1 : null };
}

/** BFS minimises number of steps, *not* total weight. O(V + E). */
export function bfs(grid, start, goal) {
  validate(grid, start, goal);
  const queue = [start], seen = new Set([key(start)]), parents = new Map(), order = [];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head++]; order.push(current);
    if (key(current) === key(goal)) break;
    for (const next of neighbours(grid, current)) {
      const id = key(next);
      if (seen.has(id)) continue;
      seen.add(id); parents.set(id, current); queue.push(next);
    }
  }
  return finishResult(goal, start, parents, order, grid);
}

/** Small binary min-heap, O(log n) push/pop. */
export class MinHeap {
  constructor() { this.items = []; }
  get length() { return this.items.length; }
  push(item) {
    const a = this.items; a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (a[parent].priority <= item.priority) break;
      a[i] = a[parent]; i = parent;
    }
    a[i] = item;
  }
  pop() {
    const a = this.items;
    if (!a.length) return undefined;
    const first = a[0], last = a.pop();
    if (!a.length) return first;
    let i = 0;
    while (2 * i + 1 < a.length) {
      let child = 2 * i + 1;
      if (child + 1 < a.length && a[child + 1].priority < a[child].priority) child++;
      if (last.priority <= a[child].priority) break;
      a[i] = a[child]; i = child;
    }
    a[i] = last;
    return first;
  }
}

/** Dijkstra / A*: weighted shortest path. Heap variant O((V + E) log V). */
function weightedSearch(grid, start, goal, heuristic) {
  validate(grid, start, goal);
  const frontier = new MinHeap(), best = new Map([[key(start), 0]]), parents = new Map();
  const settled = new Set(), order = [];
  frontier.push({ point: start, cost: 0, priority: heuristic(start, goal) });
  while (frontier.length) {
    const current = frontier.pop();
    const id = key(current.point);
    if (settled.has(id) || current.cost !== best.get(id)) continue;
    settled.add(id); order.push(current.point);
    if (id === key(goal)) break;
    for (const next of neighbours(grid, current.point)) {
      const nextId = key(next);
      if (settled.has(nextId)) continue;
      const cost = current.cost + (grid[next.r][next.c] === WEIGHT ? WEIGHT : 1);
      if (cost < (best.get(nextId) ?? Infinity)) {
        best.set(nextId, cost); parents.set(nextId, current.point);
        frontier.push({ point: next, cost, priority: cost + heuristic(next, goal) });
      }
    }
  }
  return finishResult(goal, start, parents, order, grid);
}

export const dijkstra = (grid, start, goal) => weightedSearch(grid, start, goal, () => 0);
export const astar = (grid, start, goal) => weightedSearch(grid, start, goal, manhattan);

export function runAlgorithm(name, grid, start, goal) {
  const algorithms = { bfs, dijkstra, astar };
  if (!Object.hasOwn(algorithms, name)) throw new RangeError(`Unknown algorithm: ${name}`);
  return algorithms[name](grid, start, goal);
}
