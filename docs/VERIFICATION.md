# Verification record

24 October 2026: **17 automated Node tests passed** on Node 24.21.0. The suite covers deterministic cases, malformed inputs, unreachable goals, start=goal, 1,000 seeded random maps checked against an independent Bellman–Ford oracle, 100 uniform maps, 10,000 heap operations, 200 maze cases and playback transitions. JavaScript syntax checks and static demo build passed.

Chromium smoke tests are prepared, including desktop/mobile screenshots, keyboard editing, weighted-cost comparisons, pause/step, seed reproduction and overflow checks. They have **not executed** in this environment because loopback serving was denied. Manual visual/accessibility review is still pending. A smoke test is not a full screen-reader audit.

GitHub Actions and manual Pages deployment workflows are configured but no successful run or deployed URL has yet been verified. Update this record with actual run links and results after publication.

## Known limitations

- Fixed 19×31 UI grid; horizontal scrolling on narrow screens.
- Search computation runs synchronously on the main thread; appropriate for this small grid, not a claim about huge graphs.
- The terrain model supports only walls, cost 1 and cost 5.
- No map persistence or shareable URL yet; seed reproduction depends on generator version and endpoints.
- Approximate timings are not evidence of a performance improvement.
- Browser layout, console and assistive-technology behaviour remain a release gate.
