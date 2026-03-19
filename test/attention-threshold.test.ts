import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.beforeEach(async ({page}) => {
    page = await setupCookieClickerPage(page, {saveGame: {
        buildings: {
            'Farm': {amount:20}, // Max stock = amount + 10*level
            'Mine': {amount:20},
            'Factory': {amount:20},
            'Bank': {
                level: 1,
                amount: 10, // Max stock = 20
                minigame: {
                    goods: {
                        'CRL': {val: 50+0, stock: 20}, // maxed-out stock
                        'CHC': {val: 75+1, stock: 20}, // val == 75+id, due to TriangularDistribution
                        'BTR': {val: 25+2, stock: 20},
                        'SUG': {val: 50+3, stock: 0}, // empty stock
                        'NUT': {val: 75+4, stock: 0},
                        'SLT': {val: 25+5, stock: 0},
                        'VNL': {val: 50+6, stock: 10}, // half-empty
                        'EGG': {val: 75+7, stock: 10},
                        'CNM': {val: 25+8, stock: 10},
                    },
                },
            },
            'Temple': {amount:20},
            'Wizard tower': {amount:20},
            'Shipment': {amount:20},
            'Alchemy lab': {amount:20},
            'Portal': {amount:20},
        },
        modSaveData: {
            "Insugar Trading": {
                settings: {
                    attentionThreshold: 0.5,
                }
            }
        }
    }});

    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => Game.isMinigameReady(Game.Objects['Bank']));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
    await page.waitForFunction(() => window.InsugarTrading.isDataAvailable(1, 0, 0));
    await page.evaluate(() => window.InsugarTrading.makeTestingTriangularDistribution());
    await page.evaluate(() => window.InsugarTrading.updateAllQuantileTexts());
});

test('Attention estimates are correct', async ({page}) => {
    await page.pause();
    // Test maxed-out stock
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(0))).toBeCloseTo(0, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(1))).toBeCloseTo(0.75, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(2))).toBeCloseTo(0, 10);

    // Test empty stock
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(3))).toBeCloseTo(0, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(4))).toBeCloseTo(0, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(5))).toBeCloseTo(0.75, 10);

    // Test half-full stock
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(6))).toBeCloseTo(0, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(7))).toBeCloseTo(0.75, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(8))).toBeCloseTo(0.75, 10);
});
