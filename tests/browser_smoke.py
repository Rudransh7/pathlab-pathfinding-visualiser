"""Real Chromium smoke tests for keyboard editing and playback, not algorithm proofs."""
from pathlib import Path
import subprocess
import time
import urllib.request

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / 'browser-artifacts'
ARTIFACTS.mkdir(exist_ok=True)
with (ARTIFACTS / 'server.log').open('w') as log:
    process = subprocess.Popen(['node', 'scripts/serve.mjs'], cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
    try:
        for attempt in range(100):
            try:
                urllib.request.urlopen('http://127.0.0.1:8001', timeout=1).close()
                break
            except OSError:
                if process.poll() is not None:
                    raise RuntimeError('Server failed; see browser-artifacts/server.log')
                time.sleep(.1)
        else:
            raise RuntimeError('Server did not become ready')
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(viewport={'width': 1440, 'height': 1100})
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto('http://127.0.0.1:8001')
            expect(page.locator('.cell')).to_have_count(589)
            expect(page.locator('.cell[tabindex="0"]')).to_have_count(1)
            page.locator('#compare').click()
            expect(page.locator('#comparison-rows tr')).to_have_count(3)
            assert page.locator('#comparison-rows tr').nth(0).locator('td').nth(3).inner_text() == '84'
            assert page.locator('#comparison-rows tr').nth(1).locator('td').nth(3).inner_text() == '26'
            assert page.locator('#comparison-rows tr').nth(2).locator('td').nth(3).inner_text() == '26'
            cell = page.locator('.cell[data-r="0"][data-c="0"]')
            cell.focus(); page.keyboard.press('Enter')
            expect(cell).to_have_class('cell wall')
            page.keyboard.press('ArrowRight')
            expect(page.locator('.cell[data-r="0"][data-c="1"]')).to_be_focused()
            expect(page.locator('#visited')).to_have_text('—')
            page.locator('#step').click()
            expect(page.locator('#progress')).to_contain_text('1 /')
            page.locator('#pause').click()
            expect(page.locator('#pause')).to_have_text('Pause')
            page.locator('#pause').click()
            expect(page.locator('#pause')).to_have_text('Resume')
            page.locator('#reset-search').click()
            expect(page.locator('#progress')).to_have_text('0 / 0 animation events')
            page.locator('#seed').fill('interview-2027')
            page.locator('#maze').click()
            first = page.locator('.cell').evaluate_all('(cells) => cells.map(c => c.className)')
            page.locator('#maze').click()
            assert first == page.locator('.cell').evaluate_all('(cells) => cells.map(c => c.className)')
            page.locator('#instant').check()
            page.locator('#run').click()
            expect(page.locator('#status')).to_contain_text('Complete')
            page.locator('#demo').click(); page.locator('#compare').click()
            page.screenshot(path=str(ARTIFACTS / 'desktop.png'), full_page=True)
            page.set_viewport_size({'width': 390, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Page overflows mobile viewport'
            page.screenshot(path=str(ARTIFACTS / 'mobile.png'), full_page=True)
            assert not errors, errors
            browser.close()
        print('PASS: Chromium weighted comparison, keyboard grid, pause/step/reset, seeded maze and 1440/390px layout smoke checks')
    finally:
        process.terminate()
        process.wait(timeout=10)
