# Ownership and interview guide

The AI-assisted starter already implemented BFS, Dijkstra, A*, a heap, a basic interactive grid, weighted terrain, animation and eight tests. This task retained and reviewed those algorithms, strengthened input/result contracts and tie handling, and added seeded maps, controllable playback, keyboard navigation, comparisons and independent randomised correctness checks. The subsequent work was also AI-assisted. No claim of independent student authorship, production traffic or measured speedup is made.

## Explain it in one minute

“PathLab shows how shortest-path algorithms make different choices. BFS minimises steps, whereas Dijkstra and A* minimise terrain cost. Pure search functions return an expansion order and path; a separate playback controller lets the interface pause and step through those events. I can reproduce a map from its seed and compare computed costs with an independent reference algorithm.”

Use this explanation only after tracing the implementation yourself. Identify which change you personally made and verified; do not claim the AI-assisted refinements as independent work.

## Questions and model answers

**Why can BFS choose an expensive route?** It explores by edge count, treating cost-5 and cost-1 edges equally. A longer route may have lower total cost.

**Why does Dijkstra need nonnegative weights?** Once the cheapest frontier distance is settled, nonnegative remaining edges cannot produce a cheaper path to it later. Negative edges invalidate that reasoning.

**What makes this A* heuristic safe?** Manhattan distance counts the minimum required orthogonal moves. Each costs at least one, so the estimate is admissible and consistent. Diagonal moves would require a different heuristic.

**How does the heap work?** The smallest priority sits at the root. Insert bubbles up; removal moves the last entry to the root and sifts down. Both traverse a logarithmic-height tree. Insertion sequence breaks equal-priority ties.

**Why allow duplicate heap entries?** It avoids a node-to-index map and decrease-key maintenance. The distance map identifies stale entries. Bounded grid degree keeps the memory cost manageable.

**Why not just compare A* with Dijkstra?** A shared bug could make both agree incorrectly. The tests also compare with a structurally different Bellman–Ford oracle and independently check path validity.

**Does a lower runtime prove one algorithm is better?** No. Timings on small grids are noisy; visited nodes and optimal cost are easier to interpret. The page excludes animation time but is not a benchmark study.

## Personal coding exercises

1. Add bidirectional BFS for unweighted maps. Test path reconstruction when frontiers meet at a vertex or across an edge; compare costs with the oracle. Explain the stopping condition before implementing it.
2. Add a shareable map format with versioning, bounds and input validation. Verify round trips and reject malformed or oversized input. Keep it local and avoid account/storage machinery.
3. Add optional diagonal moves, define corner-cutting policy, and implement the appropriate admissible heuristic. Write a case that demonstrates why the old Manhattan heuristic is unsafe under your chosen costs.

Choose one exercise, write the failing cases yourself and keep a short reasoning log. A smaller personally understood improvement is stronger interview evidence than another generated feature.

## Demonstration and debugging

Show the weighted example first: BFS minimises steps while weighted searches choose a cheaper detour. Pause a search, step through several expansions and explain the frontier. Generate the same seed twice, enclose the goal to demonstrate unreachable handling, and show the test command.

To debug a search, use a tiny grid in a Node test and inspect `best`, parents and frontier pops. Check whether a disagreement concerns optimal cost, tie ordering or rendering. For UI bugs, reproduce with keyboard input and inspect browser console errors. Do not infer browser correctness solely from passing pure algorithm tests.
