/* Utility to print the Highlights table in README.md
 */
import { chromium } from 'playwright';
import { openCookieClickerPage } from 'cookie-connoisseur';

const bankLevel = 1;

setTimeout(async () => {
    let browser = await chromium.launch();
    let page = await openCookieClickerPage(browser, {
        saveGame: {
            buildings: {
                Bank: {
                    amount: 1,
                    level: 1,
                },
            },
        }
    });
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);

    console.log('| Good | Average | Min | 1st quartile | Median | 3rd quartile | Max |');
    console.log('|------|---------|-----|--------------|--------|--------------|-----|');
    let goodsCount = await page.evaluate(() => Game.Objects['Bank'].minigame.goodsById.length);
    await page.waitForFunction(lvl => window.InsugarTrading.isDataAvailable(lvl, 0), bankLevel);
    for(let i = 0; i < goodsCount; i++) {
        console.log(await page.evaluate(({i, bankLevel}) => {
            let min = 0;
            while(window.InsugarTrading.data[bankLevel][i][min] <= 0) {
                min++;
            }
            let max = window.InsugarTrading.data[bankLevel][i].length + 1;
            return '| ' + Game.Objects['Bank'].minigame.goodsById[i].symbol + ' | ' +
                Math.floor(window.InsugarTrading.averagePrice(bankLevel, i)! * 100)/100 + ' | ' +
                min/10 + ' | ' +
                Math.floor(window.InsugarTrading.quantile(bankLevel, i, 0.25)! * 100)/100 + ' | ' +
                Math.floor(window.InsugarTrading.quantile(bankLevel, i, 0.50)! * 100)/100 + ' | ' +
                Math.floor(window.InsugarTrading.quantile(bankLevel, i, 0.75)! * 100)/100 + ' | ' +
                max/10 + ' | ';
        }, {i, bankLevel}));
    }

    await page.close();
    await browser.close();
});
