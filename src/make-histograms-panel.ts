/* Utility to print a SVG picture with all histograms for a given bank level and dragon boost.
 */
import { chromium } from 'playwright';
import { openCookieClickerPage } from 'cookie-connoisseur';

let args = process.argv.slice(2);
if(args.length != 2 && args.length != 3) {
    console.error('Usage: make-histograms-panel bankLevel dragonBoost [forceUpperBound]');
    process.exit(1);
}

let bankLevel = Number(args[0]);
let dragonBoost = Number(args[1]);
let forceUpperBound = args.length >= 3? Number(args[2]) : 345;
// 345 is about valueOfQuantile(50, 0.0, 17, 0.999).
// For comparison, valueOfQuantile(1, 0.0, 17, 0.999) is about 282
let dragonAura = dragonBoost >= 1 ? 20 : 0; // Supreme Intellect
let dragonAura2 = (dragonBoost % 1 == 0) ? 0 : 18; // Reality Bending

// No top-level await on cjs, so we setTimeout
setTimeout(async () => {
    let browser = await chromium.launch();
    let page = await openCookieClickerPage(browser, {
        saveGame: {
            dragonAura,
            dragonAura2,
            buildings: {
                Bank: {
                    amount: 1,
                    level: bankLevel,
                }
            }
        }
    });
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTrading.js'));
    await page.waitForFunction(() => 'Insugar Trading' in Game.mods);
    await page.waitForFunction(({level, boost}) => window.InsugarTrading.isDataAvailable(level, boost, 0), {level:bankLevel, boost:dragonBoost});

    console.log(await page.evaluate(({forceUpperBound}) => {
        let str = '';
        let bankLevel = Game.Objects['Bank'].level;
        let dragonBoost = Game.auraMult('Supreme Intellect');
        let additionalLines = window.InsugarTrading.settings.quantilesToDisplay; // use default settings
        let displayName = true;
        let innerWidth = 450, innerHeight = 295;

        str += `<svg width="${6*innerWidth}px" height="${3*innerHeight+40}px">`;
        str += '<rect width="100%" height="100%" fill="black" />'; // background
        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 6; j++) {
                let goodId = 6*i+j;
                str += `<svg width="${innerWidth}px" height="${innerHeight}px" x="${j*innerWidth}px" y="${i*innerHeight}px">`;
                str += window.InsugarTrading.SVGHistogram(bankLevel, dragonBoost, goodId, {displayName, additionalLines, forceUpperBound});
                str += '</svg>';
            }
        }
        str += `<text x="20px" y="${4*innerHeight+20}px" ` +
            'dominant-baseline="middle" fill="white" font-size="32px">' +
            'Bank level ' + bankLevel +
            '</text>';
        str += '</svg>';
        return str;
    }, {forceUpperBound}));

    await page.close();
    await browser.close();
});
