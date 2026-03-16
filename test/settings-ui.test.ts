/* Tests for the buttons in the Options menu.
 */

import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.beforeEach(async ({page}) => {
    page = await setupCookieClickerPage(page);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
});

test('Quantiles can be changed', async ({page}) => {
    expect(
        await page.evaluate('InsugarTrading.settings.quantilesToDisplay')
    ).toEqual([0.25, 0.5, 0.75]);

    await page.click('text=Options');
    await page.fill('id=InsugarTradingQuantileSlider0', '15');
    expect(
        await page.evaluate('InsugarTrading.settings.quantilesToDisplay')
    ).toEqual([0.15, 0.5, 0.75]);

    await page.fill('id=InsugarTradingQuantileSlider1', '5');
    expect(
        await page.evaluate('InsugarTrading.settings.quantilesToDisplay')
    ).toEqual([0.15, 0.05, 0.75]);
});

test('Quantiles can be created', async ({page}) => {
    await page.click('text=Options');
    await page.click('text="Add quantile"');
    expect(
        await page.evaluate('InsugarTrading.settings.quantilesToDisplay')
    ).toEqual([0.25, 0.5, 0.75, 0.5]);

    await page.click('text="Add quantile"');
    expect(
        await page.evaluate('InsugarTrading.settings.quantilesToDisplay')
    ).toEqual([0.25, 0.5, 0.75, 0.5, 0.5]);

    await page.fill('id=InsugarTradingQuantileSlider3', '95');
    expect(
        await page.evaluate('InsugarTrading.settings.quantilesToDisplay')
    ).toEqual([0.25, 0.5, 0.75, 0.95, 0.5]);
});

test('Quantiles can be removed', async ({page}) => {
    await page.click('text=Options');
    await page.click('text="Add quantile"');
    expect(
        await page.evaluate('InsugarTrading.settings.quantilesToDisplay')
    ).toEqual([0.25, 0.5, 0.75, 0.5]);
});
