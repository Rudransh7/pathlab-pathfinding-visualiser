# Verification record

## Executed checks on 24 October 2026

Source commit: `f1276c09757e04141febdfaa2169edd60a852b32`.
[GitHub Actions run 40079263821](https://github.com/Rudransh7/pathlab-pathfinding-visualiser/actions/runs/40079263821) completed successfully.

| Check | Evidence |
|---|---|
| Algorithm tests on Node 22 and 24 | 17 passed, zero failed |
| JavaScript syntax and static build | Successful on both Node versions |
| Chromium smoke suite | Successful; job 120829193338 |
| Desktop/mobile visual review | Actual 1440px/390px CI captures inspected; controls and metrics wrap; wide grid/comparison areas scroll within the page |

The suite covers deterministic cases, malformed inputs, unreachable goals, start=goal, 1,000 seeded random maps checked against an independent Bellman-Ford oracle, 100 uniform maps, 10,000 heap operations, 200 maze cases and playback transitions. Earlier local execution also passed all 17 tests on Node 24.21.0.

Chromium checks the weighted example (BFS cost 84, Dijkstra/A* cost 26), keyboard wall placement and arrow navigation, step/pause/resume/reset, reproducible maze generation, instant playback completion and no horizontal page overflow. JavaScript page errors are collected. Timings in screenshots are incidental observations, not portable benchmarks.

The [desktop](images/desktop.png) and [mobile](images/mobile.png) screenshots are genuine CI captures. A focused skip link is visible in the captures; this is a keyboard-navigation affordance. Images were not generated or simulated. Screen-reader, physical-device, Firefox and WebKit reviews remain outstanding.

## Known limitations

- Fixed 19x31 UI grid; horizontal scrolling on narrow screens. The comparison table may also need horizontal scrolling.
- Search computation is synchronous on the main thread; this suits the small teaching grid, not huge graphs.
- Terrain supports only walls, cost 1 and cost 5.
- No map persistence or shareable URL yet; seed reproduction depends on generator version and endpoints.
- Approximate timings are not evidence of a performance improvement.
- A successful static build does not itself prove deployment. No live URL is claimed until the Pages workflow and hosted page are checked.
