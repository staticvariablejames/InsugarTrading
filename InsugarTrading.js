// SPDX-License-Identifier: GPL-3.0-or-later

let InsugarTrading = {};
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');

InsugarTrading.name = "Insugar Trading";
InsugarTrading.version = "1.3.5"; // Semantic versioning
InsugarTrading.GameVersion = "2.031";
InsugarTrading.CCSEVersion = "2.025";

/* The data here is just a histogram:
 * data[bankLvl][id][value] is the number of times that the id-th stock
 * (as listed by Game.Objects['Bank'].goodsById)
 * had its price between value/10 (inclusive) and value/10+1 (exclusive),
 * while the Bank building had the level bankLvl.
 * So this histogram goes in 10-cents increments.
 *
 * The actual datasets are located in data/lvl1.js through data/lvl30.js
 * and are loaded in InsugarTrading.launch.
 * These scripts just assign appropriate arrays to this dataset.
 * Multiple of them can be loaded simultaneously.
 */
InsugarTrading.data = [null];

InsugarTrading.datasetUrl = function(bankLevel) {
    return 'https://staticvariablejames.github.io/InsugarTrading/data/lvl' + bankLevel + '.js';
}
InsugarTrading.highestAvailableDatasetLevel = 50;

/* Downloads a dataset from the github website.
 *
 * Nothing happens if the data cannot be made available,
 * or if the respective dataset was already requested.
 *
 * Whenever a dataset for a certain bank level is loaded,
 * all functions in onDatasetLoad are called,
 * passing the bank level of the newly available dataset as argument.
 */
InsugarTrading.onDatasetLoad = [];
InsugarTrading.fetchDataset = function(bankLevel) {
    if(bankLevel <= 0 || bankLevel > InsugarTrading.highestAvailableDatasetLevel) return;
    if(bankLevel in InsugarTrading.data) return; // Dataset already fetched

    InsugarTrading.data[bankLevel] = []; // Simple way of marking that a fetch request was issued

    // The following code duplicates part of Game.LoadMod,
    // but ensuring to call all functions of onDatasetLoad.
    let script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', InsugarTrading.datasetUrl(bankLevel));
    script.onload = function() {
        for(let f of InsugarTrading.onDatasetLoad) {
            f(bankLevel);
        }
    }
    document.head.appendChild(script);
}

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

/* If data is available returns true.
 * If data can be downloaded, downloads it but returns false in the meanwhile.
 * Returns false otherwise.
 */
InsugarTrading.isDataAvailable = function(bankLevel, goodId) {
    if(InsugarTrading.isGatheringData)
        return false;
    if(!(bankLevel in InsugarTrading.data)) {
        InsugarTrading.fetchDataset(bankLevel);
        return false;
    }
    return goodId in (InsugarTrading.data[bankLevel] ?? []);
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
    InsugarTrading.computePartialSums(InsugarTrading.getBankLevel());
}

InsugarTrading.datasetToString = function() {
    // Essentially returns InsugarTradingData.js.
    let str = '';
    for(let lvl in InsugarTrading.data) {
        if(lvl == 0) continue; // == instead of === because lvl is actually a string
        if(lvl != 1) str += '\n';

        str += 'InsugarTrading.data[' + lvl + '] = [];\n';
        for(let id in InsugarTrading.data[lvl]) {
            str += 'InsugarTrading.data[' + lvl + '][' + id + '] = [' +
                InsugarTrading.data[lvl][id].join(',') + '];\n';
        }
    }

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
 * It is computed by InsugarTrading.computePartialSums right after the dataset is loaded,
 * so whenever InsugarTrading.isDataAvailable(lvl, id) is true
 * (and no data was collected in this session)
 * the partial sums are available.
 */
InsugarTrading.partialSums = [];

/* Compute the partial sums for the given bank level,
 * overriding the current partialSums data if any.
 */
InsugarTrading.computePartialSums = function(lvl) {
    InsugarTrading.partialSums[lvl] = [];
    for(let id in InsugarTrading.data[lvl]) {
        InsugarTrading.partialSums[lvl][id] = new Array(InsugarTrading.data[lvl][id].length + 1);
        InsugarTrading.partialSums[lvl][id][0] = 0;
        for(let v = 0; v < InsugarTrading.data[lvl][id].length; v++) {
            // This is the only step where we actually need the numerical index
            InsugarTrading.partialSums[lvl][id][v+1] = InsugarTrading.partialSums[lvl][id][v] +
                    InsugarTrading.data[lvl][id][v];
        }
    }
}
InsugarTrading.onDatasetLoad.push(InsugarTrading.computePartialSums);

/* Returns a value such that the given fraction of the values in the histogram are smaller than it
 * and 1-fraction of the values in the histogram are higher than it.
 * A linear approximation is used inside each bin of the histogram.
 *
 * If more than one value is valid, the largest one is returned.
 *
 * If there is no available data, it returns null.
 */
InsugarTrading.quantile = function(bankLevel, goodId, fraction) {
    if(!InsugarTrading.isDataAvailable(bankLevel, goodId)) return null;

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
 */
InsugarTrading.inverseQuantile = function(bankLevel, goodId, targetValue) {
    if(!InsugarTrading.isDataAvailable(bankLevel, goodId)) return null;

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
 * If currentValue is present, generates an orange vertical line at that value.
 * If additionalLines is a list of numbers between 0 and 1;
 *  each number is considered a quantile and one vertical line is generated for each.
 * If displayName is true, the name of the stock is displayed in the top right corner.
 * If forceUpperBound is present, the histogram price axis will range from 0 to forceUpperBound;
 *  otherwise, the upper bound will be the highest 99.999% of all goods.
 *
 * Returns '' if no data is available.
 */
InsugarTrading.SVGHistogram = function(bankLevel, goodId,
    {currentValue = null, additionalLines = [], displayName = false, forceUpperBound = null})
{
    if(!InsugarTrading.isDataAvailable(bankLevel, goodId)) return '';

    let graphWidth = 430, graphHeight = 240, axesMargin = 15, bottomMargin = 20;
    if(additionalLines.length != 0) bottomMargin += 35;
    let str = `<svg width="${graphWidth+2*axesMargin}px" height="${graphHeight + bottomMargin}px">`;
    // We ignore the top margin

    let quantileThreshold = 0.99999;
    let upperPriceBound = forceUpperBound;
    if(!forceUpperBound) {
        upperPriceBound = InsugarTrading.data[bankLevel].map(
                (_, id) => InsugarTrading.quantile(bankLevel, id, quantileThreshold)
            ).reduce(
                (a, b) => Math.max(a, b)
            );
    }
    // This way, every graph has the same scale and nicely fits between 0 and upperPriceBound.

    let entryCount = InsugarTrading.data[bankLevel][goodId].length;
    let density = InsugarTrading.partialSums[bankLevel][goodId][entryCount]/100;
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
        let barHeight = InsugarTrading.rawFrequency(bankLevel, goodId, i)/density*graphHeight;
        str += 'V ' + (graphHeight - barHeight) + ' ';
    }
    str += ' Z" fill="steelblue" />';

    // Draw each additional line
    for(quantile of additionalLines) {
        let value = InsugarTrading.quantile(bankLevel, goodId, quantile);
        let x = value/upperPriceBound * graphWidth + axesMargin;
        let frequency = InsugarTrading.rawFrequency(bankLevel, goodId, Math.floor(10*value));
        let y = (1 - frequency/density)*graphHeight;
        str += `<line x1="${x}" y1="${y}" x2="${x}" y2="${graphHeight}" stroke="white" />`;
        str += `<text x="${x}" y="${graphHeight+25}" text-anchor="end" transform="rotate(-45 ${x} ${graphHeight+25})" fill="white">$${Math.floor(100*value)/100}</text>`;
    }

    /* Draw an orange line with the current price
     * Must be drawn last to not be under the adittional lines
     */
    if(currentValue) {
        let x = currentValue/upperPriceBound * graphWidth + axesMargin;
        let frequency = InsugarTrading.rawFrequency(bankLevel, goodId, Math.floor(10*currentValue));
        let y = (1 - frequency/density)*graphHeight;
        str += `<line x1="${x}" y1="${y}" x2="${x}" y2="${graphHeight}" stroke="orange" stroke-width="3px"/>`;
    }

    // Draw the name of the stock in the top right corner
    if(displayName) {
        str += `<text x="${graphWidth+axesMargin}" y="${axesMargin}" text-anchor="end"` +
            ` dominant-baseline="hanging" fill="white" font-size="x-large">` +
            InsugarTrading.minigame.goodsById[goodId].symbol +
            '</text>';
    }

    str += '</svg>';
    return str;
}

// Constructs a large image containing the histograms for all stocks
InsugarTrading.allSVGHistograms = function(bankLevel, forceUpperBound) {
    let additionalLines = InsugarTrading.settings.quantilesToDisplay;
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
            str += InsugarTrading.SVGHistogram(bankLevel, goodId, {displayName, additionalLines, forceUpperBound});
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

// Utility to save the histograms from the above
InsugarTrading.saveSVGHistograms = function(bankLevel, forceUpperBound) {
    let svg = InsugarTrading.allSVGHistograms(bankLevel, forceUpperBound);
    let blob = new Blob([svg],{type:'image/svg+xml'});
    saveAs(blob, `lvl${bankLevel}.svg`);
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
    let currentValue = InsugarTrading.minigame.goodsById[id].val;
    let additionalLines = InsugarTrading.settings.quantilesToDisplay;
    if(InsugarTrading.isDataAvailable(lvl, id)) {
        str += InsugarTrading.SVGHistogram(lvl, id, {currentValue, additionalLines});
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



/******************
 * User interface *
 ******************/

InsugarTrading.settings = { // default settings
    quantilesToDisplay: [0.25, 0.5, 0.75],
};

InsugarTrading.quantileSliderCallback = function(i) {
    let value = document.getElementById('InsugarTradingQuantileSlider' + i).value ?? 50;
    InsugarTrading.settings.quantilesToDisplay[i] = value/100;
    document.getElementById(`InsugarTradingQuantileSlider${i}RightText`).innerHTML = value + '%';
}

// Makes a slider for index i of InsugarTrading.settings.quantilesToDisplay
InsugarTrading.makeQuantileSlider = function(i) {
    return Game.WriteSlider(
        'InsugarTradingQuantileSlider' + i,
        'Quantile',
        '[$]%',
        () => Math.round(InsugarTrading.settings.quantilesToDisplay[i]*100),
        'InsugarTrading.quantileSliderCallback(' + i + ')'
    );
}

InsugarTrading.eraseQuantileSlider = function(i) {
    InsugarTrading.settings.quantilesToDisplay.splice(i, 1);
    Game.UpdateMenu();
}

InsugarTrading.customOptionsMenu = function() {
    let menuStr = "";
    let i = 0;
    for(i in InsugarTrading.settings.quantilesToDisplay) {
        menuStr += '<div class="listing">' +
            InsugarTrading.makeQuantileSlider(i) +
            `<div style="display:inline; vertical-align:top;">
                <a class="option" onclick="InsugarTrading.eraseQuantileSlider(${i});">Remove</a>
            </div>` +
        '</div>';
    }

    let length = InsugarTrading.settings.quantilesToDisplay.length;
    let onclick = `InsugarTrading.settings.quantilesToDisplay[${length}] = 0.5`;
    menuStr += `<div class="listing">
        <a class="option" onclick="${onclick};Game.UpdateMenu()">Add quantile</a>
        </div>`;
    CCSE.AppendCollapsibleOptionsMenu("Insugar Trading", menuStr);
}


/**************
 * MODING API *
 **************/

InsugarTrading.save = function() {
    return JSON.stringify({
        version: InsugarTrading.version,
        settings: InsugarTrading.settings,
    });
}

InsugarTrading.load = function(str) {
    let obj = JSON.parse(str);
    if('quantilesToDisplay' in obj.settings ?? {}) {
        InsugarTrading.settings.quantilesToDisplay = obj.settings.quantilesToDisplay;
    }

    /* In every load,
     * stockMarket.js first creates a brand new stock market and simulates 15 ticks of it
     * before overriding the data with what was in the save game.
     * So we must make sure that InsugarTrading.customTickDisplayData is called after the override.
     *
     * Hooks installed by InsugarTrading.init take care of calling this function
     * if the minigame hasn't loaded yet when InsugarTrading.load() is called.
     */
    InsugarTrading.customTickDisplayData();
}

InsugarTrading.init = function() {
    CCSE.MinigameReplacer(function(){
        // These statements require access to the stock market to work
        InsugarTrading.minigame = Game.Objects['Bank'].minigame;
        InsugarTrading.createQuantileRows();

        InsugarTrading.onDatasetLoad.push(InsugarTrading.customTickDisplayData);
        InsugarTrading.fetchDataset(InsugarTrading.getBankLevel());
    },'Bank');

    /* Technically the following statements also require access to the market
     * (because the functions we are pushing to lists require access to the market),
     * but they are only called (by CCSE) if the bank is loaded,
     * so we don't have to put them inside the MinigameReplacer function above.
     *
     * Actually, we should _not_ put them there.
     * Vanilla Cookie Clicker calls the launch() method of minigames on a hard reset (wipe save),
     * which means the function above will be called again.
     * Since we should not push custom tooltips and such twice,
     * these statements should be outside of the MinigameReplacer function above.
     */
    if(!Game.customMinigame['Bank'].tick) Game.customMinigame['Bank'].tick = [];
    Game.customMinigame['Bank'].tick.push(InsugarTrading.customTickCollectData);
    Game.customMinigame['Bank'].tick.push(InsugarTrading.customTickDisplayData);

    if(!Game.customMinigame['Bank'].buyGood) Game.customMinigame['Bank'].buyGood = [];
    Game.customMinigame['Bank'].buyGood.push(InsugarTrading.updateQuantileText);

    if(!Game.customMinigame['Bank'].sellGood) Game.customMinigame['Bank'].sellGood = [];
    Game.customMinigame['Bank'].sellGood.push(InsugarTrading.updateQuantileText);

    if(!Game.customMinigame['Bank'].goodTooltip) Game.customMinigame['Bank'].goodTooltip = [];
    Game.customMinigame['Bank'].goodTooltip.push(InsugarTrading.customGoodTooltip);

    Game.customStatsMenu.push(function() {
        CCSE.AppendStatsVersionNumber(InsugarTrading.name, InsugarTrading.version);
    });

    Game.customOptionsMenu.push(InsugarTrading.customOptionsMenu);

    Game.Notify('Insugar Trading loaded!', '', '', 1, 1);
}



/********************
 * Waiting for CCSE *
 ********************/

if(!InsugarTrading.isLoaded){
    if(CCSE && CCSE.isLoaded){
        Game.registerMod('Insugar Trading', InsugarTrading);
    }
    else {
        if(!CCSE) var CCSE = {};
        if(!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(function() {
            if(CCSE.ConfirmGameCCSEVersion(InsugarTrading.name, InsugarTrading.version, InsugarTrading.GameVersion, InsugarTrading.CCSEVersion)) {
                Game.registerMod('Insugar Trading', InsugarTrading);
            }
        });
    }
}
