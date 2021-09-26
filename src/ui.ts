/* Code to show the dataset to players.
 * Note that the Options submenu is maintained in settings.ts.
 */

import { inverseQuantile, isDataAvailable } from './dataset';
import { settings } from './settings';
import { getBankLevel, getGoodsCount, minigame } from './util';
import { SVGHistogram } from './visualization';

/* Creates a new row in each of the good-displaying boxes, right above the stock count.
 * Each box has the text "Quantile: " followed by a div with id 'quantile-0', 'quantile-1' etc.
 * Since this method is called precisely once after the minigame loads,
 * the ids are reliable and are used e.g. by updateQuantileText.
 */
export function createQuantileRows() {
    for(let i = 0; i < getGoodsCount(); i++) {
        let upperBox = document.getElementById('bankGood-' + i)!.firstChild!;
        let stockCounterDiv = document.getElementById('bankGood-' + i + '-stockBox')!;
        let quantileDiv = upperBox.insertBefore(document.createElement("div"), stockCounterDiv);

        // Copy the style from the other div, because assigning quantileDiv.style don't work
        for(let key of stockCounterDiv.style) {
            (quantileDiv.style as any)[key] = (stockCounterDiv.style as any)[key];
        }

        quantileDiv.innerHTML = 'Quantile: <div id="quantile-' + i + '" ' +
            'style="display:inline">no data</div>';
        updateQuantileText(i);
    }
}

/* An estimator for the interestingness of the given stock
 * (i.e. how much attention should be paid to that stock).
 * 0 is not interesting at all; happens if you have none of that expensive stock,
 *  or all of that cheap stock.
 * 1 is very interesting, and happens if either you have none and the stock is very cheap,
 *  or if you have a lot of that stock and is very expensive. */
export function interestingness(stockQuantile: number, purchasedPercent: number) {
    return purchasedPercent * stockQuantile + (1-purchasedPercent) * (1 - stockQuantile);
}

/* Updates the text inside the row created by createQuantileRows.
 * The signature is appropriate for Game.customMinigame.Bank.buyGood and sellGood.
 */
export function updateQuantileText(id: number) {
    let lvl = getBankLevel();
    let div = document.getElementById('quantile-' + id)!;
    if(!isDataAvailable(lvl, id)) {
        div.innerHTML = 'no data';
        div.style.color = '';
        div.style.fontWeight = '';
    } else {
        let good = minigame.goodsById[id];
        let value = good.val;
        let ownPercentage = good.stock / minigame.getGoodMaxStock(good);
        let q = inverseQuantile(lvl, id, value)!;
        div.innerHTML = (Math.floor(10000*q)/100) + '%';

        let intr = interestingness(q, ownPercentage);
        div.style.fontWeight = (intr > 0.5 ? 'bold' : '');

        // Makeshift color interpolation from gray to orange
        div.style.color = 'rgba(255, ' + // red
                (165+(1-intr)*90) + ', ' + // green
                ((1-intr)*255) + ', ' + // blue
                (0.7 + 0.3*intr) + ')'; // alpha
    }
}

export function customGoodTooltip(id: number, str: string) {
    str += '<div class="line"></div>';
    let lvl = getBankLevel();
    let currentValue = minigame.goodsById[id].val;
    let additionalLines = settings.quantilesToDisplay;
    if(isDataAvailable(lvl, id)) {
        str += SVGHistogram(lvl, id, {currentValue, additionalLines});
    } else {
        str += 'InsugarTrading: No data available.';
    }
    return str;
}

export function customTickDisplayData() {
    // We're relying on getGoodsCount() == 0 if the minigame hasn't loaded
    for(let i = 0; i < getGoodsCount(); i++) {
        updateQuantileText(i);
    }
}
