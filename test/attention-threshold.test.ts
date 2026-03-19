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
                        /* Under TriangularDistribution,
                         * value = 50+id is 50% quantile (median),
                         * value = 75+id is 87.5% quantile (highest octile),
                         * value = 25+id is 12.5% quantile (lowest octile).
                         */
                        'CRL': {val: 50+0, stock: 20}, // maxed-out stock
                        'CHC': {val: 75+1, stock: 20},
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

    // Test after raising the threshold value
    await page.evaluate(() => window.InsugarTrading.settings.attentionThreshold = 0.75);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(0))).toBeCloseTo(0, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(1))).toBeCloseTo(0.5, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(2))).toBeCloseTo(0, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(3))).toBeCloseTo(0, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(4))).toBeCloseTo(0, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(5))).toBeCloseTo(0.5, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(6))).toBeCloseTo(0, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(7))).toBeCloseTo(0.5, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(8))).toBeCloseTo(0.5, 10);

    // Test after lowering the threshold value
    await page.evaluate(() => window.InsugarTrading.settings.attentionThreshold = 0);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(0))).toBeCloseTo(0.5, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(1))).toBeCloseTo(0.875, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(2))).toBeCloseTo(0.125, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(3))).toBeCloseTo(0.5, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(4))).toBeCloseTo(0.125, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(5))).toBeCloseTo(0.875, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(6))).toBeCloseTo(0.5, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(7))).toBeCloseTo(0.875, 10);
    expect(await page.evaluate(() => window.InsugarTrading.attentionForStock(8))).toBeCloseTo(0.875, 10);
});

test('Attention estimates update graphically', async ({page}) => {
    let quantileDisplayLocator = await page.locator('id=quantile-1');
    await expect(quantileDisplayLocator).toHaveCSS('font-weight', '700'); // 700 is bold

    async function setThreshold(str: string) {
        await page.click('text=Options');
        await page.fill('id=InsugarTradingAttentionThresholdSlider', str);
        await page.click('text=Options');
    }
    await setThreshold('75');

    // Check setter works
    expect(await page.evaluate(() => window.InsugarTrading.settings.attentionThreshold)).toBe(0.75);

    // Check font-weight is still bold
    await expect(quantileDisplayLocator).toHaveCSS('font-weight', '700');

    await setThreshold('76');
    await expect(quantileDisplayLocator).toHaveCSS('font-weight', '400'); // 400 is normal
});
