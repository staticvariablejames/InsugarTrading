/* I'm aware of two mods which query Insugar Trading:
 * - <https://klattmose.github.io/CookieClicker/#idle-trading--steam> and
 * - <https://thomvandevin.gitlab.io/cookie-clicker-tax-evasion/TaxEvasion.js>
 *
 * These mods use some features of Insugar Trading;
 * these tests ensure that those features stay part of the public API.
 */
import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test('Some functions are part of the public API', async ({ page }) => {
    page = await setupCookieClickerPage(page, {saveGame: {
        buildings: {
            'Bank': {
                level: 1,
                amount: 1,
            },
        },
    }});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);

    expect(await page.evaluate('typeof InsugarTrading')).toEqual('object');
    expect(await page.evaluate('"settings" in InsugarTrading')).toBe(true);
    expect(await page.evaluate('"quantilesToDisplay" in InsugarTrading.settings')).toBe(true);
    expect(await page.evaluate('typeof InsugarTrading.quantile')).toEqual('function');
    expect(await page.innerText('#quantile-5')).toMatch(/\d*.\d*%/);
});
