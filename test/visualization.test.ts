import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.beforeEach(async ({page}) => {
    page = await setupCookieClickerPage(page, {saveGame: {
        buildings: {
            "Bank": {
                level: 1,
                amount: 685,
                minigame: {
                    goods: {
                        'SUG': {
                            val: 21.72,
                            d: -0.75,
                        },
                        'NUT': {
                            val: 4.15,
                            d: 0.02,
                        },
                    },
                },
            },
            "Temple": {amount: 678},
        },
    }});

    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
    await page.waitForFunction(() => window.InsugarTrading.isDataAvailable(1, 0.1, 0));
});

test('Creates the quantile row', async ({page}) => {
    expect(await page.locator('#bankGood-3').screenshot()).toMatchSnapshot('bankGoodPanelWithQuantileBar.png');
});

test('Highlights goods away from the median', async ({page}) => {
    expect(await page.locator('#bankGood-4').screenshot()).toMatchSnapshot('bankGoodPanelWithHighlightedQuantileBar.png');
});

test('Displays the histogram in the tooltip', async ({page}) => {
    /* The tooltip hovers above the news ticker,
     * and for some reason (anti-aliasing, perhaps?)
     * the edge of the tooltip includes a few pixels from the news ticker.
     * But the news ticker changes every time we load the game.
     * Erasing the news ticker before capturing the snapshot prevents flakiness in this test.
     * Same goes for the notes.
     */
    await page.evaluate(() => CConnoisseur.clearNewsTickerText());
    await page.evaluate(() => Game.CloseNotes());

    await page.locator('#bankGood-3').hover();
    let tooltipHandle = await page.locator('#tooltip');
    expect(await tooltipHandle!.screenshot()).toMatchSnapshot('bankGoodTooltip.png');
});
