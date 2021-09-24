/* Test that the mod does not crash if data is missing.
 */
import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.describe('works if a building is missing in a dataset', () => {
    test.beforeEach(async ({page}) => {
        page = await setupCookieClickerPage(page, {saveGame: {
            buildings: {
                "Bank": {
                    amount: 864,
                    level: 1,
                },
                "Idleverse": {
                    amount: 597,
                },
            },
        }});

        await page.route('https://staticvariablejames.github.io/InsugarTrading/data/lvl1.js',
            route => {
                route.fulfill({
                    body: 'InsugarTrading.data[1] = [];\n' +
                        'InsugarTrading.data[1][0]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][1]  = [0, 0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][2]  = [0, 0, 0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][3]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][4]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][5]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][6]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][7]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][8]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][9]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][10] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][11] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][12] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][13] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][14] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        '', // Missing Idleverses!
                });
            }
        );

        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
        await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
    });

    test('showing "no data" in the quantile row', async ({ page }) => {
        expect(await page.innerText('#quantile-15')).toEqual('no data');
    });

    test('showing "no data" in the tooltip', async ({ page }) => {
        await page.hover('#quantile-15');
        await page.waitForFunction(() => Game.tooltip.on === 1);
        expect(await page.innerText('id=tooltip')).toEqual(
            expect.stringContaining('InsugarTrading: No data available')
        );
    });
});

test.describe('works if an entire dataset is missing', () => {
    test.beforeEach(async ({page}) => {
        page = await setupCookieClickerPage(page, {saveGame: {
            buildings: {
                "Bank": {
                    amount: 864,
                    level: 1337, // We definitely don't have datasets this high...
                },
            },
        }});

        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
        await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
    });

    test('showing "no data" in the quantile row', async ({ page }) => {
        expect(await page.innerText('#quantile-3')).toEqual('no data');
    });

    test('showing "no data" in the tooltip', async ({ page }) => {
        await page.hover('#quantile-3');
        expect(await page.innerText('id=tooltip')).toEqual(
            expect.stringContaining('InsugarTrading: No data available')
        );
    });
});
