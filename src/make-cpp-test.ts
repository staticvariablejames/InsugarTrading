/* Generates a test case for use in <https://github.com/staticvariablejames/CookieClickerCppTools>.
 */
import { chromium as pw_browser } from 'playwright';
import { openCookieClickerPage, CCSave } from 'cookie-connoisseur';

const ccsave = CCSave.fromObject({
    buildings: {
        Bank: {
            amount: 1,
            level: 5,
            minigame: {
                goods: {
                    CRL: {val:  55.62, mode:"chaotic",   d:0.69,    "dur":7},
                    CHC: {val:  78.21, mode:"slow fall", d:0.19,    "dur":81},
                    BTR: {val:  50.28, mode:"chaotic",   d:0.35,    "dur":1},
                    SUG: {val:  51.14, mode:"slow rise", d:0.6,     "dur":37},
                    NUT: {val:  59.62, mode:"slow rise", d:0.75,    "dur":6},
                    SLT: {val:  44.51, mode:"slow fall", d:0.2,     "dur":74},
                    VNL: {val:  64.83, mode:"slow fall", d:-0.04,   "dur":30},
                    EGG: {val:  72.98, mode:"fast fall", d:-0.13,   "dur":71},
                    CNM: {val:  92.47, mode:"slow fall", d:-0.15,   "dur":71},
                    CRM: {val:  67.72, mode:"stable",    d:0.45,    "dur":52},
                    JAM: {val:  47.30, mode:"fast fall", d:-0.21,   "dur":65},
                    WCH: {val:  26.72, mode:"fast fall", d:-1.21,   "dur":55},
                    HNY: {val: 142.75, mode:"slow fall", d:-0.3,    "dur":54},
                    CKI: {val: 111.73, mode:"slow rise", d:0.1,     "dur":50},
                    RCP: {val: 116.10, mode:"slow rise", d:0.46,    "dur":70},
                    SBD: {val: 136.78, mode:"chaotic",   d:-0.39,   "dur":1},
                    PBL: {val: 141.23, mode:"stable",    d: -0.07,  "dur":35},
                    YOU: {val: 179.85, mode:"chaotic",   d: 0.26,   "dur":13},
                },
            },
        },
    },
});

const testCases: (number | null)[] = [
    null,
    0.0,
    0.1,
    1.0,
    1.1,
];

/* Function intended to be run inside a browser.
 * Returns a string containing a test case if given an object,
 * or a 2000-tick test if given a number (the number is used as Game.auraMult('Supreme Intellect')).
 */
function makeTest(dragonBoost: number | null) {
    let str = ''; // return value
    let indent = '    ';
    let minigame = Game.Objects['Bank'].minigame;
    let goodsCount = minigame.goodsById.length;

    function modeStr(mode: number) {
        switch(mode) {
            case 0: return 'StockMode::Stable';
            case 1: return 'StockMode::SlowRise';
            case 2: return 'StockMode::SlowFall';
            case 3: return 'StockMode::FastRise';
            case 4: return 'StockMode::FastFall';
            case 5: return 'StockMode::Chaotic';
            default: throw 'Something went wrong in modeStr';
        }
    }

    function generateAssignment(goodId: number) {
        let good = minigame.goodsById[goodId];
        let str = '';
        str += `${indent}goods[${goodId}].value(${good.val});\n`;
        str += `${indent}goods[${goodId}].delta(${good.d});\n`;
        str += `${indent}goods[${goodId}].mode(${modeStr(good.mode)});\n`;
        str += `${indent}goods[${goodId}].duration(${good.dur});\n`;
        return str;
    }

    function generateTick(dragonBoost: number) {
        let str = '';
        str += `${indent}auto glob = Stock::generateGlobalParameters(rng, ${dragonBoost});\n`;
        str += `${indent}for(int i = 0; i < ${goodsCount}; i++) goods[i].singleStockTick(rng, glob, ${dragonBoost});\n`;
        return str;
    }

    function generateCheck(goodId: number) {
        let str = '';
        let good = minigame.goodsById[goodId];
        str += `${indent}CHECK(goods[${goodId}].value() == Approx(${good.val}));\n`;
        str += `${indent}CHECK(goods[${goodId}].delta() == Approx(${good.d}));\n`;
        str += `${indent}CHECK(goods[${goodId}].mode() == ${modeStr(good.mode)});\n`;
        str += `${indent}CHECK(goods[${goodId}].duration() == ${good.dur});\n`;
        return str;
    }

    if(dragonBoost == null) {
        str += `${indent}Stock goods[${goodsCount}];\n`;
        for(let goodId = 0; goodId < goodsCount; goodId++) {
            str += `${indent}goods[${goodId}].id(${goodId});\n`;
            str += `${indent}goods[${goodId}].bank_level(${Game.Objects['Bank'].level});\n`;
            str += generateAssignment(goodId);
        }
    } else {
        Game.auraMult = (_) => dragonBoost;
        // 2000 ticks is enough for at least two mode changes for each good
        str += `${indent}SECTION("When ticked 2000 times with dragonBoost = ${dragonBoost}") {\n`;
        indent = '        ';
        str += `${indent}prng rng("test${dragonBoost}");\n`;
        str += generateTick(dragonBoost);
        str += '\n';

        Math.seedrandom("test" + dragonBoost);
        minigame.tick();
        for(let goodId = 0; goodId < goodsCount; goodId++) {
            str += generateCheck(goodId);
        }
        str += '\n';
        str += `${indent}for(int loops = 1; loops < 2000; loops++) {\n`;

        indent = '            ';
        str += generateTick(dragonBoost);
        indent = '        ';

        str += `${indent}}\n`;
        for(let loops = 1; loops < 2000; loops++) minigame.tick();
        for(let goodId = 0; goodId < goodsCount; goodId++) {
            str += generateCheck(goodId);
        }
        indent = '    ';
        str += `${indent}}\n`;
    }

    return str;
}

setTimeout(async () => {
    let browser = await pw_browser.launch();
    console.log('// Generated using make-cpp-test.ts from https://github.com/staticvariablejames/InsugarTrading');
    console.log('#include "stock.h"');
    console.log('#include "catch2/catch.hpp"');
    console.log('#include "random.h"');
    console.log('using namespace CCCPP;');
    console.log('\nTEST_CASE("Stock::tick behaves as intended", "[stock][tick]") {');

    for(let testCase of testCases) {
        let page = await openCookieClickerPage(browser, {
            saveGame: ccsave,
        });
        console.log(await page.evaluate(makeTest, testCase));
        await page.close();
    }

    console.log('}');
    await browser.close();
});
