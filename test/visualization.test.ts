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
                    },
                },
            },
        },
    }});

    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
});

test('Creates the quantile row', async ({page}) => {
    let bankGoodPanel = await page.$('#bankGood-3');
    expect(await bankGoodPanel!.screenshot()).toMatchSnapshot('bankGoodPanelWithQuantileBar.png');
});

test('Displays the histogram in the tooltip', async ({page}) => {
    await page.hover('#bankGood-3');

    /* The tooltip hovers above the news ticker,
     * and for some reason (anti-aliasing, perhaps?)
     * the edge of the tooltip includes a few pixels from the news ticker.
     * But the news ticker changes every time we load the game.
     * Erasing the news ticker before capturing the snapshot prevents flakiness in this test.
     * Same goes for the notes.
     */
    await page.evaluate(() => CConnoisseur.clearNewsTickerText());
    await page.evaluate(() => Game.CloseNotes());
    let tooltipHandle = await page.$('#tooltip');
    expect(await tooltipHandle!.screenshot()).toMatchSnapshot('bankGoodTooltip.png');
});
