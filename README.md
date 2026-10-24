# PathLab — interactive graph pathfinding laboratory

A dependency-free interactive visualisation of BFS, Dijkstra's algorithm and A* on a weighted grid. Created as an **AI-assisted learning project**: review the algorithm implementation and extend it yourself before claiming independent authorship in internship applications.

## Features

- Interactive wall, weighted tile, start and finish placement
- Drag to draw obstacles; random map generation and reset
- Animated search exploration and shortest path
- Compare BFS (minimum hops) with Dijkstra and A* (minimum cost)
- Binary min-heap priority queue instead of repeatedly sorting the frontier
- Live metrics: number of expanded nodes, path length, path cost and computation time
- Automated correctness tests, including 20 deterministically randomised maps comparing Dijkstra and A*
- No frontend frameworks or third-party dependencies required

## Run

Requires a modern browser. Serve the folder instead of opening `index.html` as a file (ES modules require a web origin):

```bash
python3 -m http.server 8001
```

Open **http://localhost:8001**.

Requires Node.js 20+ for automated tests:

```bash
npm test
```

## What the algorithms demonstrate

| Algorithm | Data structure | Finds optimal weighted cost? | Complexity on this grid |
|---|---|---|---|
| BFS | Queue | No; minimises steps | O(V + E) |
| Dijkstra | Binary min-heap | Yes | O((V + E) log V) |
| A* | Binary min-heap + Manhattan heuristic | Yes, with minimum cell cost 1 | O((V + E) log V) in common heap-based analyses |

The heuristic never overestimates because movement is cardinal only and each step costs at least 1. BFS ignores tile weights when deciding which path to take, but the UI still reports the actual weighted cost of the route it found. The reported compute time **excludes visualisation delay**.

## Suggested improvements to implement and explain in interviews

1. Add bidirectional BFS and compare explored nodes on open grids.
2. Allow diagonal movement; update heuristics to preserve admissibility.
3. Add a reproducible seeded map generator and benchmark 1,000 cases.
4. Add a maze generator (recursive division or randomised Prim).
5. Use a Web Worker for very large grids and cancellation.

## CV talking points (only after you understand and can demonstrate it)

- Implemented and compared BFS, Dijkstra and A* pathfinding with weighted grid costs.
- Used a binary min-heap priority queue and Manhattan heuristic for performant search.
- Added an interactive visualiser and automated unit and property-style regression tests.
