/* Test that the mod does not crash if data is missing.
 */
import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.describe('works if a building is missing in a dataset', () => {
    test.beforeEach(async ({page}) => {
        page = await setupCookieClickerPage(page, {saveGame: {
            dragonAura: 18, // Reality Bending, 0.1 dragon boost for Supreme Intellect
            dragonLevel: 25,
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
                    body: 'InsugarTrading.data[1] = {0.0: [], 0.1: [], 1.0: [], 1.1: []};\n' +
                        'InsugarTrading.data[1][0.1][0] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][1]  = [0, 0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][2]  = [0, 0, 0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][3]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][4]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][5]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][6]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][7]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][8]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][9]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][10] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][11] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][12] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][13] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        'InsugarTrading.data[1][0.1][14] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                        '', // Intentionally missing Idleverses and beyond, and dragon boosts != 0.1
                });
            }
        );

        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
        await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
        await page.waitForFunction(() => window.InsugarTrading.isDataAvailable(1, 0.1, 0));
    });

    test('showing "no data" in the quantile row for absent good', async ({ page }) => {
        await page.pause();
        await expect(page.locator('#quantile-3')).not.toHaveText('no data');
        await expect(page.locator('#quantile-15')).toHaveText('no data');
    });

    test('showing "no data" in the tooltip for absent good', async ({ page }) => {
        await page.locator('#quantile-3').hover();
        await page.waitForFunction(() => Game.tooltip.on === 1);
        await expect(page.locator('#tooltip')).not.toContainText('InsugarTrading: No data available');
        await page.locator('#quantile-15').hover();
        await page.waitForFunction(() => Game.tooltip.on === 1);
        await expect(page.locator('#tooltip')).toContainText('InsugarTrading: No data available');
    });

    test('showing "no data" in the quantile row for absent dragon boost', async ({ page }) => {
        await page.evaluate(() => {
            Game.dragonAura = 0;
            // Must update manually on dragon aura change
            window.InsugarTrading.updateAllQuantileTexts();
        });
        await expect(page.locator('#quantile-3')).toHaveText('no data');
    });

    test('showing "no data" in the tooltip for absent dragon boost', async ({ page }) => {
        await page.evaluate(() => {
            Game.dragonAura = 0;
            window.InsugarTrading.updateAllQuantileTexts();
        });
        await expect(page.locator('#quantile-3')).toHaveText('no data');
        await page.locator('#quantile-3').hover();
        await page.waitForFunction(() => Game.tooltip.on === 1);
        await expect(page.locator('#tooltip')).toContainText('InsugarTrading: No data available');
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
        await expect(page.locator('#quantile-3')).toHaveText('no data');
    });

    test('showing "no data" in the tooltip', async ({ page }) => {
        await page.locator('#quantile-3').hover();
        await expect(page.locator('#tooltip')).toContainText('InsugarTrading: No data available');
    });
});
