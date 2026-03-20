/* Utility to print the Highlights table in README.md
 */
import { chromium } from 'playwright';
import { openCookieClickerPage } from 'cookie-connoisseur';

async function makeSummary(bankLevel: number, aura1: number, aura2: number) {
    let browser = await chromium.launch();
    let page = await openCookieClickerPage(browser, {
        saveGame: {
            dragonAura: aura1,
            dragonAura2: aura2,
            buildings: {
                Bank: {
                    amount: 1,
                    level: bankLevel,
                },
            },
        }
    });
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);

    console.log('| Good | Average | Min | 1st quartile | Median | 3rd quartile | Max |');
    console.log('|------|---------|-----|--------------|--------|--------------|-----|');
    let goodsCount = await page.evaluate(() => Game.Objects['Bank'].minigame.goodsById.length);
    await page.waitForFunction(lvl => window.InsugarTrading.isDataAvailable(lvl, Game.auraMult('Supreme Intellect'), 0), bankLevel);
    for(let i = 0; i < goodsCount; i++) {
        console.log(await page.evaluate(({i}) => {
            let boost = Game.auraMult('Supreme Intellect');
            let bankLevel = Game.Objects['Bank'].level;
            let min = 0;
            while(window.InsugarTrading.data[bankLevel][boost][i][min] <= 0) {
                min++;
            }
            let max = window.InsugarTrading.data[bankLevel][boost][i].length + 1;
            return '| ' + Game.Objects['Bank'].minigame.goodsById[i].symbol + ' | ' +
                Math.floor(window.InsugarTrading.averagePrice(bankLevel, boost, i)! * 100)/100 + ' | ' +
                min/10 + ' | ' +
                Math.floor(window.InsugarTrading.valueOfQuantile(bankLevel, boost, i, 0.25)! * 100)/100 + ' | ' +
                Math.floor(window.InsugarTrading.valueOfQuantile(bankLevel, boost, i, 0.50)! * 100)/100 + ' | ' +
                Math.floor(window.InsugarTrading.valueOfQuantile(bankLevel, boost, i, 0.75)! * 100)/100 + ' | ' +
                max/10 + ' | ';
        }, {i}));
    }

    await page.close();
    await browser.close();
};

// No top-level await on cjs, so we setTimeout
setTimeout(async () => {
    await makeSummary(1, 0, 0);
    console.log();
    await makeSummary(1, 18, 20);
});
