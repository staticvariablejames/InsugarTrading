import { test, expect } from '@playwright/test';
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
        settings: {
            quantilesToDisplay: [0.25, 0.5, 0.75],
        },
    });
});

test.describe('Settings are parsed', () => {
    let save = CCSave.fromObject({
        modSaveData: {
            'Insugar Trading': {
                version: version,
                settings: {
                    quantilesToDisplay: [0.15, 0.5, 0.75],
                },
            },
        },
    });

    test('from local storage', async ({page}) => {
        page = await setupCookieClickerPage(page, {saveGame: save});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
        await page.waitForFunction(() => 'Insugar Trading' in Game.mods);

        let quantiles = await page.evaluate('InsugarTrading.settings.quantilesToDisplay');
        expect(quantiles).toEqual([0.15, 0.5, 0.75]);
    });

    test('after loading the game', async ({page}) => {
        page = await setupCookieClickerPage(page);
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
        await page.waitForFunction(() => 'Insugar Trading' in Game.mods);

        await page.evaluate(s => Game.LoadSave(s), CCSave.toNativeSave(save));

        let quantiles = await page.evaluate('InsugarTrading.settings.quantilesToDisplay');
        expect(quantiles).toEqual([0.15, 0.5, 0.75]);
    });
});
