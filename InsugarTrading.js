// SPDX-License-Identifier: GPL-3.0-or-later

var InsugarTrading = {};
// 'var' used here to avoid syntax errors if this script is loaded more than once
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
// CCSE calls Game.Win('Third-party') for us

// InsugarTrading.launch is at the end of this file.
InsugarTrading.name = "Insugar Trading";
InsugarTrading.version = "1.1.2"; // Semantic versioning
InsugarTrading.GameVersion = "2.029";
InsugarTrading.CCSEVersion = "2.017";

/* The data here is just a histogram:
 * data[bankLvl][id][value] is the number of times that the id-th stock
 * (as listed by Game.Objects['Bank'].goodsById)
 * had its price between value/10 (inclusive) and value/10+1 (exclusive),
 * while the Bank building had the level bankLvl.
 * So this histogram goes in 10-cents increments.
 *
 * The actual dataset is in InsugarTradingData.js,
 * loaded in InsugarTrading.launch.
 */
InsugarTrading.data = [null];

InsugarTrading.minigame = null; // Set to Game.Objects['Bank'].minigame on InsugarTrading.launch()

InsugarTrading.isGatheringData = false;
/* isGatheringData is managed by the Data Gathering part of the mod.
 * In short, data should not be accessed while isGatheringData is true.
 */

// Utility accessor functions
InsugarTrading.getBankLevel = function() {
    if(InsugarTrading.minigame) {
        return InsugarTrading.minigame.parent.level;
    } else {
        return 0; // The minigame was not loaded yet
    }
}

InsugarTrading.getGoodsCount = function() {
    return InsugarTrading.minigame.goodsById.length;
}

InsugarTrading.isDataAvailable = function(bankLevel, goodId) {
    if(InsugarTrading.isGatheringData)
        return false;
    if(bankLevel <= 0 || bankLevel >= InsugarTrading.data.length)
        return false;
    if(goodId > InsugarTrading.data[bankLevel].length)
        return false;
    return true;
}

/* Returns InsugarTrading.data[bankLevel][goodId][value] if available.
 * If !isDataAvailable(bankLevel, goodId), returns null.
 * If data is available but the value is out of range, returns 0,
 * which is actually what "frequency" means in this case.
 */
InsugarTrading.rawFrequency = function(bankLevel, goodId, value) {
    if(!InsugarTrading.isDataAvailable(bankLevel, goodId)) {
        return null;
    }
    let a = InsugarTrading.data[bankLevel][goodId];
    if(value < 0 || value >= a.length) {
        return 0;
    }
    return a[value];
}



/******************
 * DATA GATHERING *
 ******************/

/* Increases the value of InsugarTrading.data[bankLevel][goodId][value] by one,
 * taking care to create the necessary array entries if needed.
 *
 * The intermediary arrays InsugarTrading.data and InsugarTrading.data[lvl] may be sparse,
 * but InsugarTrading.data[lvl][id] will be filled with zeros to mantain density.
 */
InsugarTrading.incrementFrequency = function(bankLevel, goodId, value) {
    if(InsugarTrading.data.length <= bankLevel)
        InsugarTrading.data[bankLevel] = [];
    if(InsugarTrading.data[bankLevel].length <= goodId)
        InsugarTrading.data[bankLevel][goodId] = [];

    for(let v = InsugarTrading.data[bankLevel][goodId].length; v <= value; v++)
        InsugarTrading.data[bankLevel][goodId][v] = 0;

    InsugarTrading.data[bankLevel][goodId][value]++;
}

/* InsugarTrading.launch() makes sure this function runs every time the stock market ticks. */
InsugarTrading.customTickCollectData = function() {
    if(!InsugarTrading.isGatheringData) return;
    for(let id = 0; id < InsugarTrading.getGoodsCount(); id++) {
        let value = InsugarTrading.minigame.goodsById[id].val;
        value = Math.floor(10*value);
        InsugarTrading.incrementFrequency(InsugarTrading.getBankLevel(), id, value);
    }
}

/* Makeshift tool to tick the stock market more often than what the game could normally do.
 * InsugarTrading.isGatheringData is set to true while the fast ticker is running;
 * during this period, InsugarTrading.data will be changed, so it shouldn't be queried.
 * Once ticks >= tickTarget,
 * InsugarTrading.isGatheringData is set back to false
 * and the fast ticking stops.
 */
InsugarTrading.fastTicker = {};
InsugarTrading.fastTicker.ticks = 0; // Number of ticks already seen
InsugarTrading.fastTicker.tickTarget = Infinity; // Data collection ends when ticks === tickTarget
InsugarTrading.fastTicker.ticksPerCall = 100;
InsugarTrading.fastTicker.intervalID = undefined;

/* Collects data for the given number of ticks.
 * The data is aggregated to the current dataset.
 */
InsugarTrading.fastTicker.collectData = function(tickTarget, discardCurrentDataset) {
    if(discardCurrentDataset) InsugarTrading.data = [null];
    // InsugarTrading.fastTicker.incrementFrequency takes care of filling the blanks

    this.tickTarget = tickTarget;
    this.ticks = 0;
    InsugarTrading.isGatheringData = true;

    InsugarTrading.minigame.secondsPerTick = 1e300; // kludge
    /* Setting secondsPerTick to a very large number
     * effectively prevents the stock market from ticking "naturally" again.
     * The goal is to prevent issues with reentrancy,
     * i.e. the natural tick being interrupted by a forced tick from this object.
     * (I don't even know if this is a possibility with Javascript
     * but I wanted to be sure.)
     *
     * We undo this in this.stop().
     */

    this.intervalID = window.setInterval(this.tickSeveralTimes.bind(this), 1000);
}

InsugarTrading.fastTicker.tickSeveralTimes = function() {
    let beginTime = Date.now();
    for(let i = 0; i < this.ticksPerCall; i++) {
        InsugarTrading.minigame.tick();
        this.ticks++;
        if(this.ticks >= this.tickTarget) {
            this.stopDataCollection();
            return;
        }
    }
    let endTime = Date.now();
    if(endTime - beginTime < 800) { // less than 800ms
        this.ticksPerCall *= 1.2; // speed up
        /* I don't know beforehand how fast we can tick the minigame.
         * This is a simple way of maximizing for speed without guessing.
         */
    }

    console.log("Progress: " + (100*this.ticks/this.tickTarget) + "%");
}

InsugarTrading.fastTicker.stopDataCollection = function() {
    // Reset stuff
    window.clearInterval(this.intervalID);
    InsugarTrading.isGatheringData = false;
    InsugarTrading.minigame.secondsPerTick = 60; // undo the kludge
}

InsugarTrading.datasetToString = function() {
    // Essentially returns InsugarTradingData.js.
    let str = 'InsugarTrading.data = [null];\n\n';
    for(let lvl in InsugarTrading.data) {
        if(lvl == 0) continue; // == instead of === because lvl is actually a string

        str += 'InsugarTrading.data[' + lvl + '] = [];\n';
        for(let id in InsugarTrading.data[lvl]) {
            str += 'InsugarTrading.data[' + lvl + '][' + id + '] = [' +
                InsugarTrading.data[lvl][id].join(',') + '];\n';
        }
        str += '\n';
    }

    str += 'InsugarTrading.customTickDisplayData();\n';
    /* Adding this call at the end of the file guarantees the "Quantile: XX%" text boxes
     * have the correct text right after the dataset is loaded,
     * rather than having to wait till the next tick for it.
     */

    return str;
}


/****************************
 * DATA PROCESSING/ANALYSIS *
 ****************************/

/* InsugarTrading.partialSums[lvl][id] contains the partial sums of InsugarTrading.data[lvl][id].
 * More specifically, InsugarTrading.partialSums[lvl][id][value]
 * is the sum of InsugarTrading.partialSums[lvl][id][v] for v = 0,...,value-1.
 * So, for example,
 * InsugarTrading.partialSums[id].length === InsugarTrading.data[id].length + 1,
 * and the last value of InsugarTrading.partialSums[lvl][id] equals InsugarTrading.tickCount[lvl].
 *
 * It is computed by InsugarTrading.computePartialSums,
 * unless the data is unavailable or the partial sums are already computed.
 *
 * Setting InsugarTrading.partialSums to null clears the "partial sum cache"
 * and triggers a recomputation.
 */
InsugarTrading.partialSums = null;
InsugarTrading.computePartialSums = function() {
    if(InsugarTrading.data === null || InsugarTrading.partialSums !== null) return;
    InsugarTrading.partialSums = new Array(InsugarTrading.data.length);
    for(let lvl = 1; lvl < InsugarTrading.partialSums.length; lvl++) {
        InsugarTrading.partialSums[lvl] = new Array(InsugarTrading.getGoodsCount());
        for(let id = 0; id < InsugarTrading.getGoodsCount(); id++) {
            InsugarTrading.partialSums[lvl][id] = new Array(InsugarTrading.data[lvl][id].length + 1);
            InsugarTrading.partialSums[lvl][id][0] = 0;
            for(let v = 0; v < InsugarTrading.data[lvl][id].length; v++) {
                InsugarTrading.partialSums[lvl][id][v+1] = InsugarTrading.partialSums[lvl][id][v] +
                        InsugarTrading.data[lvl][id][v];
            }
        }
    }
}

/* Returns a value such that the given fraction of the values in the histogram are smaller than it
 * and 1-fraction of the values in the histogram are higher than it.
 * A linear approximation is used inside each bin of the histogram.
 *
 * If more than one value is valid, the largest one is returned.
 *
 * If there is no available data, it returns null.
 *
 * This function queries InsugarTrading.partialSums,
 */
InsugarTrading.quantile = function(bankLevel, goodId, fraction) {
    if(!InsugarTrading.isDataAvailable(bankLevel, goodId)) return null;

    InsugarTrading.computePartialSums();
    if(fraction < 0) return -Infinity;
    if(fraction > 1) return Infinity;

    // Binary search, Hermann Bottenbruch version. i is a lower bound, j is an upper bound
    let a = InsugarTrading.partialSums[bankLevel][goodId];
    let i = 0, j = a.length-1;
    let target = fraction * a[j];
    while(i !== j) {
        // Invariant: if k is the largest index such that a[k] <= target, then i <= k <= j.
        let middle = Math.ceil((i+j)/2);
        if(a[middle] > target) {
            j = middle - 1;
        } else {
            i = middle;
        }
    }
    // At the end of the loop, i is the largest index such that a[i] <= target.

    let knownQuantile = i/10;
    // Linear approximation:
    let excess = target - a[i]; // How much we need to take into account for the approximation
    let estimatedQuantile = 0;
    if(excess > 0) {
        estimatedQuantile += excess/InsugarTrading.data[bankLevel][goodId][i]/10;
        /* This 'if' prevents a possible division by zero if InsugarTrading.data[goodId][i] === 0
         * It also can never execute if i === InsugarTrading.data[goodId].length,
         * because this would force excess to be 0.
         */
    }
    return knownQuantile + estimatedQuantile;
}

/* Returns the proportion of values in the histogram for goodId
 * which are smaller than the given value.
 * The result is a value between 0 and 1 (inclusive).
 * A linear approximation is used inside each bin of the histogram.
 *
 * If there is no available data, it returns null.
 *
 * This function queries InsugarTrading.partialSums.
 */
InsugarTrading.inverseQuantile = function(bankLevel, goodId, targetValue) {
    if(!InsugarTrading.isDataAvailable(bankLevel, goodId)) return null;

    InsugarTrading.computePartialSums();
    let value = 10 * targetValue; // The histogram works in increments of 0.1
    if(value <= 0) return 0;
    if(value >= InsugarTrading.data[bankLevel][goodId].length) return 1;

    let partialSums = InsugarTrading.partialSums[bankLevel][goodId];
    let knownToBeSmaller = partialSums[Math.floor(value)];
    let fraction = value - Math.floor(value);
    // linear approximation inside the bin number Math.floor(value)
    let estimatedToBeSmaller = fraction * InsugarTrading.data[bankLevel][goodId][Math.floor(value)];
    return (knownToBeSmaller + estimatedToBeSmaller)/partialSums[partialSums.length-1];
}

/* Computes the average price for the given good in the dataset.
 *
 * A linear approximation is used inside each bin.
 */
InsugarTrading.averagePrice = function(bankLevel, goodId) {
    if(!InsugarTrading.isDataAvailable(bankLevel, goodId)) return null;
    let sum = 0;
    let observations = 0;
    for(let i = 0; i < InsugarTrading.data[bankLevel][goodId].length; i++) {
        sum += (i/10+0.05) * InsugarTrading.data[bankLevel][goodId][i];
        observations += InsugarTrading.data[bankLevel][goodId][i];
    }
    return sum/observations;
}

/* Constructs a string containing the SVG code for a histogram for the given good.
 *
 * Returns '' if no data is available.
 */
InsugarTrading.SVGhistogram = function(bankLevel, goodId, currentPrice) {
    if(!InsugarTrading.isDataAvailable(bankLevel, goodId)) return '';

    let graphWidth = 430, graphHeight = 240, axesMargin = 10, bottomMargin = 20;
    let str = `<svg width="${graphWidth+2*axesMargin}px" height="${graphHeight + bottomMargin}px">`;
    // We ignore the top margin

    let quantileThreshold = 0.99999;
    let upperPriceBound = InsugarTrading.data[bankLevel].map(
            (_, id) => InsugarTrading.quantile(bankLevel, i, quantileThreshold)
        ).reduce(
            (a, b) => Math.max(a, b)
        );
    // This way, every graph has the same scale and nicely fits between 0 and upperPriceBound.

    let upperDensityBound = 5000000; // TODO: add proper computation methods

    // Draw axes
    str += `<path d="M ${axesMargin} 0 v ${graphHeight} h ${axesMargin+graphWidth}$"`
        + ' stroke="white" fill="none" />';

    // One axis tick every $10
    for(let t = 0; t < upperPriceBound; t+=10) {
        let x = t/upperPriceBound * graphWidth + axesMargin;
        str += `<line x1="${x}" y1="${graphHeight-2}" x2="${x}" y2="${graphHeight+2}" stroke="white" />`;
        // One label every $50
        if(t % 50 === 0) {
            str += `<text x="${x}" y="${graphHeight+bottomMargin/2}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="x-small">$${t}</text>`;
        }
    }

    // Draw the histogram
    str += `<path d="M ${axesMargin} ${graphHeight} `;
    for(let i = 0; i < 10*upperPriceBound; i++) {
        if(i > 0) str += 'h ' + (graphWidth/10/upperPriceBound) + ' ';
        let barHeight = InsugarTrading.rawFrequency(bankLevel, goodId, i)/upperDensityBound*graphHeight;
        str += 'V ' + (graphHeight - barHeight) + ' ';
    }
    str += ' Z" fill="cyan" />';

    // Draw an orange line with the current price
    let x = currentPrice/upperPriceBound * graphWidth + axesMargin;
    str += `<line x1="${x}" y1="0" x2="${x}" y2="${graphHeight}" stroke="orange" />`;

    str += '</svg>';
    return str;
}



/****************
 * DATA DISPLAY *
 ****************/

/* Creates a new row in each of the good-displaying boxes, right above the stock count.
 * Each box has the text "Quantile: " followed by a div with id 'quantile-0', 'quantile-1' etc.
 * Since this method is called precisely once after the minigame loads,
 * the ids are reliable and are used e.g. by updateQuantileText.
 */
InsugarTrading.createQuantileRows = function() {
    for(let i = 0; i < InsugarTrading.getGoodsCount(); i++) {
        let upperBox = document.getElementById('bankGood-' + i).firstChild;
        let stockCounterDiv = document.getElementById('bankGood-' + i + '-stockBox');
        let quantileDiv = upperBox.insertBefore(document.createElement("div"), stockCounterDiv);

        // Copy the style from the other div, because assigning quantileDiv.style don't work
        for(let key in stockCounterDiv.style) {
            quantileDiv.style[key] = stockCounterDiv.style[key];
        }

        quantileDiv.innerHTML = 'Quantile: <div id="quantile-' + i + '" ' +
            'style="display:inline">no data</div>';
        InsugarTrading.updateQuantileText(i);
    }
}

/* An estimator for the interestingness of the given stock
 * (i.e. how much attention should be paid to that stock).
 * 0 is not interesting at all; happens if you have none of that expensive stock,
 *  or all of that cheap stock.
 * 1 is very interesting, and happens if either you have none and the stock is very cheap,
 *  or if you have a lot of that stock and is very expensive. */
InsugarTrading.interestingness = function(stockQuantile, purchasedPercent) {
    return purchasedPercent * stockQuantile + (1-purchasedPercent) * (1 - stockQuantile);
}

/* Updates the text inside the row created by InsugarTrading.createQuantileRows.
 * The signature is appropriate for Game.customMinigame.Bank.buyGood and sellGood.
 */
InsugarTrading.updateQuantileText = function(id) {
    let lvl = InsugarTrading.getBankLevel();
    let div = document.getElementById('quantile-' + id);
    if(!InsugarTrading.isDataAvailable(lvl, id)) {
        div.innerHTML = 'no data';
        div.style.color = '';
        div.style.fontWeight = '';
    } else {
        let good = InsugarTrading.minigame.goodsById[id];
        let value = good.val;
        let ownPercentage = good.stock / InsugarTrading.minigame.getGoodMaxStock(good);
        let q = InsugarTrading.inverseQuantile(lvl, id, value);
        div.innerHTML = (Math.floor(10000*q)/100) + '%';

        let intr = InsugarTrading.interestingness(q, ownPercentage);
        div.style.fontWeight = (intr > 0.5 ? 'bold' : '');

        // Makeshift color interpolation from gray to orange
        div.style.color = 'rgba(255, ' + // red
                (165+(1-intr)*90) + ', ' + // green
                ((1-intr)*255) + ', ' + // blue
                (0.7 + 0.3*intr) + ')'; // alpha
    }
}

InsugarTrading.customGoodTooltip = function(id, str) {
    str += '<div class="line"></div>';
    let lvl = InsugarTrading.getBankLevel();
    if(InsugarTrading.isDataAvailable(lvl, id)) {
        str += InsugarTrading.SVGhistogram(lvl, id, InsugarTrading.minigame.goodsById[id].val);
    } else {
        str += 'InsugarTrading: No data available.';
    }
    return str;
}

InsugarTrading.customTickDisplayData = function() {
    if(InsugarTrading.minigame === null) return;
    /* InsugarTradingData.js calls this method as soon as it is loaded,
     * so we have to make sure this will not throw an exception
     * if the bank minigame hasn't loaded yet.
     */

    if(InsugarTrading.isGatheringData) return;
    /* InsugarTrading.updateQuantileText manipulates the DOM
     * regardless of whether the data is available or not.
     * If this check was missing, that would meant thousands of DOM manipulations per second,
     * which significantly slows down data collection
     * (a factor of 5 in my experiments).
     */

    for(let i = 0; i < InsugarTrading.minigame.goodsById.length; i++) {
        InsugarTrading.updateQuantileText(i);
    }
}



/**************
 * MOD LAUNCH *
 **************/

InsugarTrading.launch = function() {
    if(!CCSE.ConfirmGameCCSEVersion(InsugarTrading.name, InsugarTrading.version, InsugarTrading.GameVersion, InsugarTrading.CCSEVersion)) {
        InsugarTrading.isLoaded = true;
        return;
    }

    Game.LoadMod('https://staticvariablejames.github.io/InsugarTrading/InsugarTradingData.js');

    CCSE.MinigameReplacer(function(){
        InsugarTrading.minigame = Game.Objects['Bank'].minigame;
        InsugarTrading.createQuantileRows();
        Game.customMinigame['Bank'].tick.push(function() {
            InsugarTrading.customTickCollectData();
            InsugarTrading.customTickDisplayData();
        });
        Game.customMinigame['Bank'].buyGood.push(InsugarTrading.updateQuantileText);
        Game.customMinigame['Bank'].sellGood.push(InsugarTrading.updateQuantileText);
        Game.customMinigame['Bank'].goodTooltip.push(InsugarTrading.customGoodTooltip);
    },'Bank');

    Game.customStatsMenu.push(function() {
        CCSE.AppendStatsVersionNumber(InsugarTrading.name, InsugarTrading.version);
    });

    InsugarTrading.isLoaded = true;
}

// Code copied from CCSE's documentation
if(!InsugarTrading.isLoaded){
	if(CCSE && CCSE.isLoaded){
		InsugarTrading.launch();
	}
	else{
		if(!CCSE) var CCSE = {};
		if(!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
		CCSE.postLoadHooks.push(InsugarTrading.launch);
	}
}
