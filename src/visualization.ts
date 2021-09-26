/* Functions to produce the visualizations for the dataset
 */

import { data, isDataAvailable, partialSums, quantile, rawFrequency } from './dataset';
import { minigame } from './util';
import { settings } from './settings';

type SVGHistogramOptions = {
    currentValue?: number,
    additionalLines?: number[],
    displayName?: boolean,
    forceUpperBound?: number
}

/* Constructs a string containing the SVG code for a histogram for the given good.
 *
 * If currentValue is present, generates an orange vertical line at that value.
 * If additionalLines is a list of numbers between 0 and 1;
 *  each number is considered a quantile and one vertical line is generated for each.
 * If displayName is true, the name of the stock is displayed in the top right corner.
 * If forceUpperBound is present, the histogram price axis will range from 0 to forceUpperBound;
 *  otherwise, the upper bound will be the highest 99.999% of all goods.
 *
 * Returns '' if no data is available.
 */
export function SVGHistogram(bankLevel: number, goodId: number, options: SVGHistogramOptions = {}) {
    if(!isDataAvailable(bankLevel, goodId)) return '';

    if(!options.additionalLines) {
        options.additionalLines = [];
    }

    let graphWidth = 430, graphHeight = 240, axesMargin = 15, bottomMargin = 20;
    if(options.additionalLines.length != 0) bottomMargin += 35;
    let str = `<svg width="${graphWidth+2*axesMargin}px" height="${graphHeight + bottomMargin}px">`;
    // We ignore the top margin

    let quantileThreshold = 0.99999;
    let upperPriceBound;
    if(options.forceUpperBound) {
        upperPriceBound = options.forceUpperBound;
    } else {
        upperPriceBound = data[bankLevel].map(
                (_, id) => quantile(bankLevel, id, quantileThreshold)!
            ).reduce(
                (a, b) => Math.max(a, b)
            );
    }
    // This way, every graph has the same scale and nicely fits between 0 and upperPriceBound.

    let entryCount = data[bankLevel][goodId].length;
    let density = partialSums[bankLevel][goodId][entryCount]/100;
    /* This way, a stock that is uniformly distributed over a range of $10
     * would form a rectangle whose height is the entire range. */

    // Draw axes
    str += `<path d="M ${axesMargin} 0 v ${graphHeight} h ${axesMargin+graphWidth}"`
        + ' stroke="white" fill="none" />';

    // One axis tick every $10
    for(let t = 0; t < upperPriceBound; t+=10) {
        let x = t/upperPriceBound * graphWidth + axesMargin;
        str += `<line x1="${x}" y1="${graphHeight-2}" x2="${x}" y2="${graphHeight+2}" stroke="white" />`;
        // One label every $50
        if(t % 50 === 0) {
            str += `<text x="${x}" y="${graphHeight+10}" text-anchor="middle" dominant-baseline="middle" fill="white">$${t}</text>`;
        }
    }

    // Draw the histogram
    str += `<path d="M ${axesMargin} ${graphHeight} `;
    for(let i = 0; i < 10*upperPriceBound; i++) {
        if(i > 0) str += 'h ' + (graphWidth/10/upperPriceBound) + ' ';
        let barHeight = rawFrequency(bankLevel, goodId, i)!/density*graphHeight;
        str += 'V ' + (graphHeight - barHeight) + ' ';
    }
    str += ' Z" fill="steelblue" />';

    // Draw each additional line
    for(let q of options.additionalLines) {
        let value = quantile(bankLevel, goodId, q)!;
        let x = value/upperPriceBound * graphWidth + axesMargin;
        let frequency = rawFrequency(bankLevel, goodId, Math.floor(10*value))!;
        let y = (1 - frequency/density)*graphHeight;
        str += `<line x1="${x}" y1="${y}" x2="${x}" y2="${graphHeight}" stroke="white" />`;
        str += `<text x="${x}" y="${graphHeight+25}" text-anchor="end" transform="rotate(-45 ${x} ${graphHeight+25})" fill="white">$${Math.floor(100*value)/100}</text>`;
    }

    /* Draw an orange line with the current price
     * Must be drawn last to not be under the adittional lines
     */
    if(options.currentValue) {
        let x = options.currentValue/upperPriceBound * graphWidth + axesMargin;
        let frequency = rawFrequency(bankLevel, goodId, Math.floor(10*options.currentValue))!;
        let y = (1 - frequency/density)*graphHeight;
        str += `<line x1="${x}" y1="${y}" x2="${x}" y2="${graphHeight}" stroke="orange" stroke-width="3px"/>`;
    }

    // Draw the name of the stock in the top right corner
    if(options.displayName) {
        str += `<text x="${graphWidth+axesMargin}" y="${axesMargin}" text-anchor="end"` +
            ` dominant-baseline="hanging" fill="white" font-size="x-large">` +
            minigame.goodsById[goodId].symbol +
            '</text>';
    }

    str += '</svg>';
    return str;
}

// Constructs a large image containing the histograms for all stocks
export function allSVGHistograms(bankLevel: number, forceUpperBound: number) {
    let additionalLines = settings.quantilesToDisplay;
    let displayName = true;
    let innerWidth = 450, innerHeight = 260;
    if(additionalLines.length > 0) innerHeight += 35;

    let str = '';
    str += `<svg width="${4*innerWidth}px" height="${4*innerHeight+40}px">`;
    str += '<rect width="100%" height="100%" fill="black" />'; // background
    for(let i = 0; i < 4; i++) {
        for(let j = 0; j < 4; j++) {
            let goodId = 4*i+j;
            str += `<svg width="${innerWidth}px" height="${innerHeight}px" x="${j*innerWidth}px" y="${i*innerHeight}px">`;
            str += SVGHistogram(bankLevel, goodId, {displayName, additionalLines, forceUpperBound});
            str += '</svg>';
        }
    }
    str += `<text x="20px" y="${4*innerHeight+20}px" ` +
        'dominant-baseline="middle" fill="white" font-size="32px">' +
        'Bank level ' + bankLevel +
        '</text>';
    str += '</svg>';
    return str;
}
