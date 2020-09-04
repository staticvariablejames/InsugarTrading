var InsugarTrading = {};
// 'var' used here to avoid syntax errors if this script is loaded more than once
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
// CCSE calls Game.Win('Third-party') for us

InsugarTrading.minigame = null; // Set to Game.Objects['Bank'].minigame on InsugarTrading.launch()
InsugarTrading.isGatheringData = false; // Set to false when the data collection is to stop
InsugarTrading.tickCount = 0;
InsugarTrading.tickTarget = Infinity; // If tickCount >= tickTarget, isGatheringData is set to false

/* InsugarTrading.data is initialized by InsugarTrading.startDataCollection().
 * The data here is just a histogram:
 * data[id][value] is the number of times that the id-th stock
 * (as listed by Game.Objects['Bank'].goodsById)
 * had its price between value/10 (inclusive) and value/10+1 (exclusive).
 * So this histogram goes in 10-cents increments.
 */
InsugarTrading.data = null;

/* InsugarTrading.partialSums[id] contains the partial sums of InsugarTrading.data[id].
 * More specifically, InsugarTrading.partialSums[id][value]
 * is the sum of InsugarTrading.partialSums[id][v] for v = 0,...,value-1.
 * So, for example,
 * InsugarTrading.partialSums[id].length === InsugarTrading.data[id].length + 1,
 * and the last value of InsugarTrading.partialSums[id] equals InsugarTrading.tickCount.
 *
 * It is computed by InsugarTrading.computePartialSums,
 * unless the data is unavailable or the partial sums are already computed.
 */
InsugarTrading.partialSums = null;
InsugarTrading.computePartialSums = function() {
    if(InsugarTrading.data === null || InsugarTrading.partialSums !== null) return;
    InsugarTrading.partialSums = new Array(InsugarTrading.data.length);
    for(let id = 0; id < InsugarTrading.data.length; id++) {
        InsugarTrading.partialSums[id] = new Array(InsugarTrading.data[id].length + 1);
        InsugarTrading.partialSums[id][0] = 0;
        for(let v = 0; v < InsugarTrading.data[id].length; v++) {
            InsugarTrading.partialSums[id][v+1] = InsugarTrading.partialSums[id][v] +
                    InsugarTrading.data[id][v];
        }
    }
}

/* Returns a value such that the given fraction of the values in the histogram are smaller than it
 * and 1-fraction of the values in the histogram are higher than it.
 * A linear approximation is used inside each bin of the histogram.
 *
 * If more than one value is valid, the largest one is returned.
 *
 * This function queries InsugarTrading.partialSums.
 */
InsugarTrading.quantile = function(goodId, fraction) {
    InsugarTrading.computePartialSums();
    if(fraction < 0) return -Infinity;
    if(fraction > 1) return Infinity;

    // Binary search, Hermann Bottenbruch version
    let a = InsugarTrading.partialSums[goodId];
    let i = 0, j = InsugarTrading.data[goodId].length; // i is a lower bound, j is an upper bound
    let target = fraction * InsugarTrading.tickCount;
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
        estimatedQuantile += excess/InsugarTrading.data[goodId][i]/10;
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
 * This function queries InsugarTrading.partialSums. */
InsugarTrading.inverseQuantile = function(goodId, targetValue) {
    InsugarTrading.computePartialSums();
    let value = 10 * targetValue; // The histogram works in increments of 0.1
    if(value <= 0) return 0;
    if(value >= InsugarTrading.data[goodId].length) return 1;

    let knownToBeSmaller = InsugarTrading.partialSums[goodId][Math.floor(value)];
    let fraction = value - Math.floor(value);
    // linear approximation inside the bin number Math.floor(value)
    let estimatedToBeSmaller = fraction * InsugarTrading.data[goodId][Math.floor(value)];
    return (knownToBeSmaller + estimatedToBeSmaller)/InsugarTrading.tickCount;
}

/* Makeshift tool to tick the stock market more often than what the game could normally do.
 * The fast ticker kills itself once InsugarTrading.isGatheringData is set to false.
 */
InsugarTrading.fastTicker = {};
InsugarTrading.fastTicker.ticksPerCall = 100;
InsugarTrading.fastTicker.intervalID = undefined;
InsugarTrading.fastTicker.start = function() {
    InsugarTrading.minigame.secondsPerTick = 1e300; // kludge
    /* Setting secondsPerTick to a very large number
     * effectively prevents the stock market from ticking "naturally" again.
     * The goal is to prevent issues with reentrancy,
     * i.e. the natural tick being interrupted by a forced tick from this object.
     * (I don't even know if this is a possibility with Javascript
     * but I wanted to be sure.)
     */

    this.intervalID = window.setInterval(this.tickSeveralTimes.bind(this), 1000);
}
InsugarTrading.fastTicker.tickSeveralTimes = function() {
    let beginTime = Date.now();
    for(let i = 0; i < this.ticksPerCall; i++) {
        if(!InsugarTrading.isGatheringData) {
            this.stop();
            return;
        }
        InsugarTrading.minigame.tick();
    }
    let endTime = Date.now();
    if(endTime - beginTime < 800) { // less than 800ms
        this.ticksPerCall *= 1.2; // speed up
        /* I don't know how fast my computer can tick the minigame.
         * This is a simple way of maximizing for speed without guessing.
         */
    }
}
InsugarTrading.fastTicker.stop = function() {
    // Reset stuff
    window.clearInterval(this.intervalID);
    this.ticksPerCall = 100;
    InsugarTrading.minigame.secondsPerTick = 60;
}

/* InsugarTrading.launch() makes sure this function runs every time the stock market ticks. */
InsugarTrading.customTickCollectData = function() {
    if(!InsugarTrading.isGatheringData) return;
    for(let id = 0; id < InsugarTrading.data.length; id++) {
        let value = InsugarTrading.minigame.goodsById[id].val;
        value = Math.floor(10*value);
        InsugarTrading.data[id][value]++;
    }

    InsugarTrading.tickCount++;
    if(InsugarTrading.tickCount >= InsugarTrading.tickTarget) {
        InsugarTrading.isGatheringData = false;
    }
}

InsugarTrading.collectData = function(tickTarget) {
    InsugarTrading.data = new Array(InsugarTrading.minigame.goodsById.length);
    for(let id = 0; id < InsugarTrading.data.length; id++) {
        InsugarTrading.data[id] = new Array(3000);
        for(let value = 0; value < InsugarTrading.data[id].length; value++)
            InsugarTrading.data[id][value] = 0;
    }

    InsugarTrading.tickCount = 0;
    InsugarTrading.tickTarget = tickTarget;
    InsugarTrading.isGatheringData = true;
    InsugarTrading.fastTicker.start();
}

InsugarTrading.datasetToString = function() {
    // Essentially prints InsugarTradingData.js.
    let str = '// Precomputed dataset for InsugarTrading\n';
    str += 'InsugarTrading.tickCount = ' + InsugarTrading.tickCount + ';\n';
    str += 'InsugarTrading.data = new Array(' + InsugarTrading.data.length + ');\n';
    for(let i = 0; i < InsugarTrading.data.length; i++) {
        str += 'InsugarTrading.data[' + i + '] = [' + InsugarTrading.data[i].join(',') + '];\n';
    }
    return str;
}

// Creates a new row in each of the good-displaying boxes, right above the stock count
InsugarTrading.createQuantileRows = function() {
    for(let i = 0; i < InsugarTrading.minigame.goodsById.length; i++) {
        let upperBox = document.getElementById('bankGood-' + i).firstChild;
        let stockCounterDiv = document.getElementById('bankGood-' + i + '-stockBox');
        let quantileDiv = upperBox.insertBefore(document.createElement("div"), stockCounterDiv);

        // Copy the style from the other div, because assigning quantileDiv.style don't work
        for(let key in stockCounterDiv.style) {
            quantileDiv.style[key] = stockCounterDiv.style[key];
        }

        quantileDiv.innerHTML = 'Quantile: <div id="quantile-' + i + '" ' +
            'style="display:inline">no data</div>';
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

InsugarTrading.customTickDisplayData = function() {
    if(InsugarTrading.isGatheringData) return;
    for(let i = 0; i < InsugarTrading.minigame.goodsById.length; i++) {
        let div = document.getElementById('quantile-' + i);
        if(InsugarTrading.data === null) {
            div.innerHTML = 'no data';
            div.style.color = '';
            div.style.fontWeight = '';
        } else {
            let good = InsugarTrading.minigame.goodsById[i];
            let value = good.val;
            let ownPercentage = good.stock / InsugarTrading.minigame.getGoodMaxStock(good);
            let q = InsugarTrading.inverseQuantile(i, value);
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
}

InsugarTrading.launch = function() {
    CCSE.MinigameReplacer(function(){
        InsugarTrading.minigame = Game.Objects['Bank'].minigame;
        InsugarTrading.createQuantileRows();
        Game.customMinigame['Bank'].tick.push(function() {
            InsugarTrading.customTickCollectData();
            InsugarTrading.customTickDisplayData();
        });
    },'Bank');
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
