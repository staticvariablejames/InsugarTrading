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
        await page.evaluate(() => window.InsugarTrading.settings.quantilesToDisplay)
    ).toEqual([0.25, 0.5, 0.75]);

    await page.getByText('Options').click();
    await page.locator('#InsugarTradingQuantileSlider0').fill('15');
    expect(
        await page.evaluate(() => window.InsugarTrading.settings.quantilesToDisplay)
    ).toEqual([0.15, 0.5, 0.75]);

    await page.locator('#InsugarTradingQuantileSlider1').fill('5');
    expect(
        await page.evaluate(() => window.InsugarTrading.settings.quantilesToDisplay)
    ).toEqual([0.15, 0.05, 0.75]);
});

test('Quantiles can be created', async ({page}) => {
    await page.getByText('Options').click();
    await page.getByText('Add quantile').click();
    expect(
        await page.evaluate(() => window.InsugarTrading.settings.quantilesToDisplay)
    ).toEqual([0.25, 0.5, 0.75, 0.5]);

    await page.getByText('Add quantile').click();
    expect(
        await page.evaluate(() => window.InsugarTrading.settings.quantilesToDisplay)
    ).toEqual([0.25, 0.5, 0.75, 0.5, 0.5]);

    await page.locator('#InsugarTradingQuantileSlider3').fill('95');
    expect(
        await page.evaluate(() => window.InsugarTrading.settings.quantilesToDisplay)
    ).toEqual([0.25, 0.5, 0.75, 0.95, 0.5]);
});

test('Quantiles can be removed', async ({page}) => {
    await page.getByText('Options').click();
    await page.getByText('Remove').first().click();
    expect(
        await page.evaluate(() => window.InsugarTrading.settings.quantilesToDisplay)
    ).toEqual([0.5, 0.75]);
});

test('Attention threshold can be changed', async ({page}) => {
    expect(await page.evaluate(() => window.InsugarTrading.settings.attentionThreshold)).toEqual(0.75);

    await page.getByText('Options').click();
    await page.locator('#InsugarTradingAttentionThresholdSlider').fill('50');
    expect(await page.evaluate(() => window.InsugarTrading.settings.attentionThreshold)).toEqual(0.5);

    await page.locator('#InsugarTradingAttentionThresholdSlider').fill('15');
    expect(await page.evaluate(() => window.InsugarTrading.settings.attentionThreshold)).toEqual(0.15);
});

test('Goods autohiding can be toggled', async ({page}) => {
    expect(await page.evaluate(() => window.InsugarTrading.settings.autohideUninterestingGoods)).toEqual(false);

    await page.getByText('Options').click();
    await page.getByText('Autohide goods OFF').click();
    expect(await page.evaluate(() => window.InsugarTrading.settings.autohideUninterestingGoods)).toEqual(true);

    await page.getByText('Autohide goods ON').click();
    expect(await page.evaluate(() => window.InsugarTrading.settings.autohideUninterestingGoods)).toEqual(false);
});
