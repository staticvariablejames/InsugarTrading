import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test('The mod loads itself', async ({page}) => {
    page = await setupCookieClickerPage(page);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
    expect(await page.evaluate('InsugarTrading')).not.toBeFalsy();
});

test('The mod loads its data', async ({page}) => {
    page = await setupCookieClickerPage(page);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
    await page.evaluate('InsugarTrading.fetchDataset(5)');
    await page.waitForFunction('InsugarTrading.data[5].length != 0');
    expect(await page.evaluate('InsugarTrading.data[5].length')).toEqual(16);
});

test('Functions in onDatasetLoad are properly called', async ({page}) => {
    page = await setupCookieClickerPage(page);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
    await page.evaluate('window.calledWith = null');
    await page.evaluate('InsugarTrading.onDatasetLoad.push(n => {window.calledWith = n})');
    await page.evaluate('InsugarTrading.fetchDataset(5)');
    await page.waitForFunction('InsugarTrading.data[5].length != 0');
    expect(await page.evaluate('window.calledWith')).toEqual(5);
});
