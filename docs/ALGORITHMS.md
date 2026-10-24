# Algorithms and design decisions

## Graph model

Each traversable grid cell is a vertex. Edges join its four orthogonal neighbours; diagonals are forbidden. Moving into a normal cell costs 1 and moving into a weighted cell costs 5. Walls are absent from the graph. The starting cell contributes no cost. Reaching the same start/goal is a valid zero-step, zero-cost path. An unreachable result has `found: false`, an empty path and `null` cost/steps.

## Searches

| Algorithm | Frontier | Guarantee | Time | Auxiliary space |
|---|---|---|---|---|
| BFS | Array with a moving head index | Fewest edges; cheapest path only when all edges have equal weight | O(V + E) | O(V) |
| Dijkstra | Binary min-heap ordered by g | Minimum total cost for nonnegative edges | O((V + E) log V) on this grid | O(V + E) |
| A* | Binary min-heap ordered by g + h | Minimum total cost with this consistent heuristic | O((V + E) log V) worst case on this grid | O(V + E) |

The grid has at most four outgoing edges per vertex, so E = O(V) and both weighted algorithms use O(V) auxiliary space here. The heap has no decrease-key operation: an improved distance pushes another entry and stale entries are ignored on pop. In a general graph the more precise lazy-heap bound is O((V + E) log E). The bounded-degree grid makes log E = O(log V).

Manhattan distance is `abs(dr) + abs(dc)`. Every move changes it by at most one and costs at least one, so it never overestimates the remaining cost and is consistent. This justifies settling a cell once and stopping when the goal is popped. Changing movement rules or costs requires revisiting the heuristic. A* is not guaranteed to explore fewer cells on every map.

BFS marks cells seen when enqueued, avoiding repeated frontier entries. Its queue does not use `shift()`, which would move array elements. All searches keep parent pointers to reconstruct the path. Stable FIFO heap ties make repeated runs reproducible; different optimal paths can still have equal cost.

## Maps and animation

`maps.js` hashes a supplied seed and uses a deterministic PRNG. Obstacle maps intentionally may be unreachable. Maze generation carves passages with iterative randomised depth-first traversal, then connects arbitrary endpoints to interior passages. It is O(rows × columns) time/space and does not risk a recursive call-stack overflow. Endpoint attachment can introduce loops; the result is not advertised as a perfect maze for every endpoint choice.

Algorithms are pure synchronous functions. `playback.js` models idle/paused/running/complete state; `ui.js` renders events with animation frames. Pause, step and speed affect playback, not shortest-path calculations. Grid edits invalidate previous results. Separating computation from animation lets correctness tests run without a browser.

## Metrics

Visited count is the number of uniquely expanded cells, including start and a reached goal. Steps count edges. Cost sums destination-cell costs. Comparison runs all algorithms on the same grid and shows the median of nine computation timings, excluding animation. Small timings are noisy because of timer resolution, JIT compilation and other browser activity; they are illustrative, not a reproducible performance benchmark.

## Verification strategy

The test oracle is an independently implemented Bellman–Ford relaxation routine. BFS is compared with unit edge costs; Dijkstra and A* with terrain costs. Tests also validate adjacency, obstacles and path cost rather than requiring one tie-dependent path. Fixed seeds make failures reproducible. Randomised checks increase confidence but do not prove correctness; the invariants above explain why the algorithms work.
