import { test, expect } from '@playwright/test';
import { settings } from '../src/settings';
import { setupCookieClickerPage, CCSave } from 'cookie-connoisseur';
import { version } from '../package.json';

test('Settings are saved', async ({page}) => {
    page = await setupCookieClickerPage(page);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);

    let nativeSaveGame = await page.evaluate(() => Game.WriteSave(1));
    let save = CCSave.fromNativeSave(nativeSaveGame);
    expect('Insugar Trading' in save.modSaveData).toBe(true);
    expect(save.modSaveData['Insugar Trading']).toEqual({
        version: version,
        settings, // default settings
    });
});

test.describe('Settings are parsed', () => {
    let save = CCSave.fromObject({
        modSaveData: {
            'Insugar Trading': {
                version: version,
                settings: {
                    attentionThreshold: 0.25,
                    autohideUninterestingGoods: true,
                    quantilesToDisplay: [0.15, 0.5, 0.75],
                },
            },
        },
    });

    test('from local storage', async ({page}) => {
        page = await setupCookieClickerPage(page, {saveGame: save});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
        await page.waitForFunction(() => 'Insugar Trading' in Game.mods);

        expect(await page.evaluate(() => window.InsugarTrading.settings.attentionThreshold))
            .toEqual(0.25);
        expect(await page.evaluate(() => window.InsugarTrading.settings.autohideUninterestingGoods))
            .toEqual(true);
        expect(await page.evaluate(() => window.InsugarTrading.settings.quantilesToDisplay))
            .toEqual([0.15, 0.5, 0.75]);
    });

    test('after loading the game', async ({page}) => {
        page = await setupCookieClickerPage(page);
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
        await page.waitForFunction(() => 'Insugar Trading' in Game.mods);

        await page.evaluate(s => Game.LoadSave(s), CCSave.toNativeSave(save));

        expect(await page.evaluate(() => window.InsugarTrading.settings.attentionThreshold))
            .toEqual(0.25);
        expect(await page.evaluate(() => window.InsugarTrading.settings.autohideUninterestingGoods))
            .toEqual(true);
        expect(await page.evaluate(() => window.InsugarTrading.settings.quantilesToDisplay))
            .toEqual([0.15, 0.5, 0.75]);
    });
});
