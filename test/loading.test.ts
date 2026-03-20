import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.beforeEach(async ({page}) => {
    page = await setupCookieClickerPage(page);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
});

test('The mod loads itself', async ({page}) => {
    expect(await page.evaluate(() => window.InsugarTrading)).not.toBeFalsy();
});

test('The mod loads its data', async ({page}) => {
    await page.evaluate(() => window.InsugarTrading.fetchDataset(5));
    await page.waitForFunction('InsugarTrading.isDataAvailable(5, 0.0, 1)');
    expect(await page.evaluate(() => window.InsugarTrading.data[5][0.0].length)).toEqual(18);
});

test('Functions in onDatasetLoad are properly called', async ({page}) => {
    await page.evaluate(() => {
        window.InsugarTrading.onDatasetLoad.push(
            n => window.localStorage.setItem('calledWith', String(n))
        );
        window.InsugarTrading.fetchDataset(5);
    });
    await page.waitForFunction(() => window.InsugarTrading.isDataAvailable(5, 0.1, 0));
    expect(await page.evaluate(() => window.localStorage.getItem('calledWith'))).toBe('5');
});
