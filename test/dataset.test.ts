import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test.beforeEach(async ({page}) => {
    page = await setupCookieClickerPage(page, {saveGame: {
        buildings: {
            "Bank": {
                level: 1,
            },
        },
    }});

    await page.route('https://staticvariablejames.github.io/InsugarTrading/data/lvl1.js',
        route => {
            route.fulfill({
                body: 'InsugarTrading.data[1] = [];\n' +
                    'InsugarTrading.data[1][0]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][1]  = [0, 0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][2]  = [0, 0, 0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][3]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][4]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][5]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][6]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][7]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][8]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][9]  = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][10] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][11] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][12] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][13] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][14] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    'InsugarTrading.data[1][15] = [0, 1, 2, 3, 4, 4, 3, 2, 1];\n' +
                    '',
            });
        }
    );

    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
});

test('Self-test, dataset is properly overriden', async ({page}) => {
    expect(await page.evaluate('typeof InsugarTrading')).toBe('object');
    expect(await page.evaluate(() => Game.Objects.Bank.level)).toEqual(1);

    await page.evaluate('InsugarTrading.fetchDataset(1)');
    await page.waitForFunction('InsugarTrading.data[1] !== undefined');
    expect(Array.isArray(await page.evaluate('InsugarTrading.data[1]'))).toBeTruthy();
    expect(await page.evaluate('InsugarTrading.data[1].length')).toBe(16);
    expect(Array.isArray(await page.evaluate('InsugarTrading.data[1][0]'))).toBeTruthy();
    expect(await page.evaluate('InsugarTrading.data[1][0].length')).toBe(9);
});

test('Partial sums are computed upon dataset loading', async ({page}) => {
    expect(await page.evaluate('InsugarTrading.partialSums')).not.toBeNull();
    expect(await page.evaluate('InsugarTrading.partialSums.length')).toBe(2);
    expect(await page.evaluate('InsugarTrading.partialSums[1].length')).toBe(16);
    expect(await page.evaluate('InsugarTrading.partialSums[1][0].length')).toBe(10);
    expect(await page.evaluate('InsugarTrading.partialSums[1][1].length')).toBe(11);
    expect(await page.evaluate('InsugarTrading.partialSums[1][2].length')).toBe(12);
    expect(await page.evaluate('InsugarTrading.partialSums[1][0]')).toEqual(
        [0, 0, 1, 3, 6, 10, 14, 17, 19, 20]
    );
});

test('Quantiles are properly calculated', async ({page}) => {
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, -1)')).toEqual(-Infinity);
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, 1.01)')).toEqual(Infinity);
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, 0)')).toBeCloseTo(0.1, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, 0.025)')).toBeCloseTo(0.15, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, 0.0375)')).toBeCloseTo(0.175, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, 0.05)')).toBeCloseTo(0.2, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 1, 0.05)')).toBeCloseTo(0.3, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 2, 0.05)')).toBeCloseTo(0.4, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, 0.10)')).toBeCloseTo(0.25, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, 0.15)')).toBeCloseTo(0.3, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, 0.3)')).toBeCloseTo(0.4, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, 0.5)')).toBeCloseTo(0.5, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, 0.6)')).toBeCloseTo(0.55, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, 0.7)')).toBeCloseTo(0.6, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 1, 0.7)')).toBeCloseTo(0.7, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 2, 0.7)')).toBeCloseTo(0.8, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 0, 1)')).toBeCloseTo(0.9, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 1, 1)')).toBeCloseTo(1.0, 10);
    expect(await page.evaluate('InsugarTrading.quantile(1, 2, 1)')).toBeCloseTo(1.1, 10);
    expect(await page.evaluate('InsugarTrading.quantile(0, 0, 0.5)')).toBeNull();
    expect(await page.evaluate('InsugarTrading.quantile(1, 17, 0.5)')).toBeNull();
});

test('Inverse quantiles are properly calculated', async ({page}) => {
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, -1)')).toBeCloseTo(0, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 0)')).toBeCloseTo(0, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 1.21)')).toBeCloseTo(1, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 0.1)')).toBeCloseTo(0, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 0.15)')).toBeCloseTo(0.025, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 0.175)')).toBeCloseTo(0.0375, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 0.2)')).toBeCloseTo(0.05, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 0.25)')).toBeCloseTo(0.10, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 0.3)')).toBeCloseTo(0.15, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 1, 0.4)')).toBeCloseTo(0.15, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 2, 0.5)')).toBeCloseTo(0.15, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 0.4)')).toBeCloseTo(0.3, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 0.5)')).toBeCloseTo(0.5, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 0.55)')).toBeCloseTo(0.6, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 0.6)')).toBeCloseTo(0.7, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 1, 0.7)')).toBeCloseTo(0.7, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 2, 0.8)')).toBeCloseTo(0.7, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 1.0)')).toBeCloseTo(1, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 0, 1.2)')).toBeCloseTo(1, 10);
    expect(await page.evaluate('InsugarTrading.inverseQuantile(0, 0, 0.5)')).toBeNull();
    expect(await page.evaluate('InsugarTrading.inverseQuantile(1, 17, 0.5)')).toBeNull();
});

test('Average prices are properly calculated', async ({page}) => {
    expect(await page.evaluate('InsugarTrading.averagePrice(1, 0)')).toBeCloseTo(0.5, 10);
    expect(await page.evaluate('InsugarTrading.averagePrice(1, 1)')).toBeCloseTo(0.6, 10);
    expect(await page.evaluate('InsugarTrading.averagePrice(1, 2)')).toBeCloseTo(0.7, 10);
});
