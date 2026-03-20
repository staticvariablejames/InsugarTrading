/* Code to show the dataset to players.
 * Note that the Options submenu is maintained in settings.ts.
 */

import { fetchDataset, inverseQuantile, isDataAvailable } from './dataset';
import { settings, onSettingsChange } from './settings';
import { getBankLevel, getGoodsCount, getDragonBoost, minigame } from './util';
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

/* An estimator for how much attention should be paid to a good with the given quantile,
 * respecting settings.attentionThreshold.
 * 0 is not interesting at all; happens if you have none of that expensive good,
 *  or all of that cheap good.
 * 1 is very interesting, and happens if either you have none and the good is very cheap,
 *  or if you have a lot of that good and is very expensive.
 *
 * For intermediate values, if canSell,
 * this function returns 0 if stockQuantile is below settings.attentionThreshold,
 * and interpolates linearly between settings.attentionThreshold and 1.
 * The opposite happens if canBuy.
 * If both canBuy and canSell we return the maximum of the two directions.
 */
export function attentionForQuantile(stockQuantile: number, canBuy: boolean, canSell: boolean) {
    let t = settings.attentionThreshold;
    let attentionIfSelling = (stockQuantile - t)/(1-t);
    if(!(attentionIfSelling > 0)) attentionIfSelling = 0; // weird conditional also handles NaN
    if(!canSell) attentionIfSelling = 0;
    let attentionIfBuying = (1-t - stockQuantile)/(1-t);
    if(!(attentionIfBuying > 0)) attentionIfBuying = 0;
    if(!canBuy) attentionIfBuying = 0;
    return Math.max(attentionIfBuying, attentionIfSelling);
}

/* Returns the attentionForQuantile of the given stock.
 */
export function attentionForStock(stockId: number) {
    let good = minigame.goodsById[stockId];
    let value = good.val;
    let canBuy = good.stock < minigame.getGoodMaxStock(good);
    let canSell = good.stock > 0;
    let quantile = inverseQuantile(getBankLevel(), getDragonBoost(), stockId, value)!;
    return attentionForQuantile(quantile, canBuy, canSell);
}

/* Updates the text inside the row created by createQuantileRows.
 * The signature is appropriate for Game.customMinigame.Bank.buyGood and sellGood.
 */
export function updateQuantileText(id: number) {
    let lvl = getBankLevel();
    let boost = getDragonBoost();
    let div = document.getElementById('quantile-' + id)!;
    if(!isDataAvailable(lvl, boost, id)) {
        fetchDataset(lvl);
        div.innerHTML = 'no data';
        div.style.color = '';
        div.style.fontWeight = '';
    } else {
        let good = minigame.goodsById[id];
        let value = good.val;
        let q = inverseQuantile(lvl, boost, id, value)!;
        div.innerHTML = (Math.floor(10000*q)/100) + '%';

        let att = attentionForStock(id);
        div.style.fontWeight = (att >= 0.5 ? 'bold' : '');

        // Makeshift color interpolation from grey (which is div.parentElement.style.color) to orange
        att = Math.min(1, att/0.9); // Make it attain max oranginess at 0.9 attention
        div.style.color = 'rgba(255, ' + // red
                (165+(1-att)*90) + ', ' + // green
                ((1-att)*255) + ', ' + // blue
                (0.7 + 0.3*att) + ')'; // alpha
    }
}

export function customGoodTooltip(id: number, str: string) {
    str += '<div class="line"></div>';
    let lvl = getBankLevel();
    let boost = getDragonBoost();
    let currentValue = minigame.goodsById[id].val;
    let additionalLines = settings.quantilesToDisplay;
    if(isDataAvailable(lvl, boost, id)) {
        str += SVGHistogram(lvl, boost, id, {currentValue, additionalLines});
    } else {
        fetchDataset(lvl);
        str += 'InsugarTrading: No data available.';
    }
    return str;
}

/* Calls updateQuantileText for all goods.
 * This will be run when the minigame is loaded or ticks.
 */
export function updateAllQuantileTexts() {
    // We're relying on getGoodsCount() == 0 if the minigame hasn't loaded
    for(let i = 0; i < getGoodsCount(); i++) {
        updateQuantileText(i);
    }
}
onSettingsChange.push(updateAllQuantileTexts);

/* Called on settings change and on tick.
 */
export function toggleVisibilityInterestingGoods() {
    if(!settings.autohideUninterestingGoods) return;
    for(let i = 0; i < getGoodsCount(); i++) {
        minigame.goodsById[i].hidden = (attentionForStock(i) == 0);
        minigame.updateGoodStyle(i);
    }
}
onSettingsChange.push(toggleVisibilityInterestingGoods);
