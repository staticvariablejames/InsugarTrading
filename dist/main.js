(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
})((function () { 'use strict';

    /* Utilities for fetching and querying the dataset.
     */
    /* The data here is just a histogram:
     * data[bankLvl][id][value] is the number of times that the id-th stock
     * (as listed by Game.Objects['Bank'].goodsById)
     * had its price between value/10 (inclusive) and value/10+1 (exclusive),
     * while the Bank building had the level bankLvl.
     * So this histogram goes in 10-cents increments.
     *
     * The file main.ts makes sure that the array below
     * is globally available as window.InsugarTrading.data;
     * this allows the files data/lvl1.ts through data/lvl50.js to populate it.
     */
    const data = [];
    function datasetUrl(bankLevel) {
        return 'https://staticvariablejames.github.io/InsugarTrading/data/lvl' + bankLevel + '.js';
    }
    const highestAvailableDatasetLevel = 50;
    /* Downloads a dataset from the github website.
     *
     * Nothing happens if the data cannot be made available,
     * or if the respective dataset was already requested.
     *
     * Whenever a dataset for a certain bank level is loaded,
     * all functions in onDatasetLoad are called,
     * passing the bank level of the newly available dataset as argument.
     */
    const onDatasetLoad = [];
    function fetchDataset(bankLevel) {
        if (bankLevel <= 0 || bankLevel > highestAvailableDatasetLevel)
            return;
        if (bankLevel in data)
            return; // Dataset already fetched
        data[bankLevel] = []; // Simple way of marking that a fetch request was issued
        // The following code duplicates part of Game.LoadMod,
        // but ensuring to call all functions of onDatasetLoad.
        let script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', datasetUrl(bankLevel));
        script.onload = function () {
            for (let f of onDatasetLoad) {
                f(bankLevel);
            }
        };
        document.head.appendChild(script);
    }
    /* If data is available returns true.
     * If data can be downloaded, downloads it but returns false in the meanwhile.
     * Returns false otherwise.
     */
    function isDataAvailable(bankLevel, goodId) {
        if (!(bankLevel in data)) {
            fetchDataset(bankLevel);
            return false;
        }
        return goodId in (data[bankLevel] ?? []);
    }
    /* Returns data[bankLevel][goodId][value] if available.
     * If !isDataAvailable(bankLevel, goodId), returns null.
     * If data is available but the value is out of range, returns 0,
     * which is actually what "frequency" means in this case.
     */
    function rawFrequency(bankLevel, goodId, value) {
        if (!isDataAvailable(bankLevel, goodId)) {
            return null;
        }
        let a = data[bankLevel][goodId];
        if (value < 0 || value >= a.length) {
            return 0;
        }
        return a[value];
    }
    /* partialSums[lvl][id] contains the partial sums of data[lvl][id].
     * More specifically, partialSums[lvl][id][value]
     * is the sum of partialSums[lvl][id][v] for v = 0,...,value-1.
     * So, for example,
     * partialSums[id].length === data[id].length + 1.
     *
     * It is computed by computePartialSums right after the dataset is loaded,
     * so whenever isDataAvailable(lvl, id) is true
     * the partial sums are available.
     */
    const partialSums = [];
    /* Compute the partial sums for the given bank level,
     * overriding the current partialSums data if any.
     */
    function computePartialSums(lvl) {
        partialSums[lvl] = [];
        for (let id in data[lvl]) {
            partialSums[lvl][id] = new Array(data[lvl][id].length + 1);
            partialSums[lvl][id][0] = 0;
            for (let v = 0; v < data[lvl][id].length; v++) {
                // This is the only step where we actually need the numerical index
                partialSums[lvl][id][v + 1] = partialSums[lvl][id][v] +
                    data[lvl][id][v];
            }
        }
    }
    onDatasetLoad.push(computePartialSums);
    /* Returns a value such that the given fraction of the values in the histogram are smaller than it
     * and 1-fraction of the values in the histogram are higher than it.
     * A linear approximation is used inside each bin of the histogram.
     *
     * If more than one value is valid, the largest one is returned.
     *
     * If there is no available data, it returns null.
     */
    function quantile(bankLevel, goodId, fraction) {
        if (!isDataAvailable(bankLevel, goodId))
            return null;
        if (fraction < 0)
            return -Infinity;
        if (fraction > 1)
            return Infinity;
        // Binary search, Hermann Bottenbruch version. i is a lower bound, j is an upper bound
        let a = partialSums[bankLevel][goodId];
        let i = 0, j = a.length - 1;
        let target = fraction * a[j];
        while (i !== j) {
            // Invariant: if k is the largest index such that a[k] <= target, then i <= k <= j.
            let middle = Math.ceil((i + j) / 2);
            if (a[middle] > target) {
                j = middle - 1;
            }
            else {
                i = middle;
            }
        }
        // At the end of the loop, i is the largest index such that a[i] <= target.
        let knownQuantile = i / 10;
        // Linear approximation:
        let excess = target - a[i]; // How much we need to take into account for the approximation
        let estimatedQuantile = 0;
        if (excess > 0) {
            estimatedQuantile += excess / data[bankLevel][goodId][i] / 10;
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
    function inverseQuantile(bankLevel, goodId, targetValue) {
        if (!isDataAvailable(bankLevel, goodId))
            return null;
        let value = 10 * targetValue; // The histogram works in increments of 0.1
        if (value <= 0)
            return 0;
        if (value >= data[bankLevel][goodId].length)
            return 1;
        let sum = partialSums[bankLevel][goodId];
        let knownToBeSmaller = sum[Math.floor(value)];
        let fraction = value - Math.floor(value);
        // linear approximation inside the bin number Math.floor(value)
        let estimatedToBeSmaller = fraction * data[bankLevel][goodId][Math.floor(value)];
        return (knownToBeSmaller + estimatedToBeSmaller) / sum[sum.length - 1];
    }
    /* Computes the average price for the given good in the dataset.
     *
     * A linear approximation is used inside each bin.
     */
    function averagePrice(bankLevel, goodId) {
        if (!isDataAvailable(bankLevel, goodId))
            return null;
        let sum = 0;
        let observations = 0;
        for (let i = 0; i < data[bankLevel][goodId].length; i++) {
            sum += (i / 10 + 0.05) * data[bankLevel][goodId][i];
            observations += data[bankLevel][goodId][i];
        }
        return sum / observations;
    }

    var version$1 = "1.4.0";

    /* Houses the settings object
     * and the code that creates the submenu in Options.
     */
    let settings = {
        quantilesToDisplay: [0.25, 0.5, 0.75],
    };
    function quantileSliderCallback(i) {
        let slider = document.getElementById('InsugarTradingQuantileSlider' + i);
        let value = slider?.value ?? 50;
        settings.quantilesToDisplay[i] = Number(value) / 100;
        document.getElementById(`InsugarTradingQuantileSlider${i}RightText`).innerHTML = value + '%';
    }
    // Makes a slider for index i of InsugarTrading.settings.quantilesToDisplay
    function makeQuantileSlider(i) {
        return Game.WriteSlider('InsugarTradingQuantileSlider' + i, 'Quantile', '[$]%', () => Math.round(settings.quantilesToDisplay[i] * 100), 'InsugarTrading.quantileSliderCallback(' + i + ')');
    }
    function eraseQuantileSlider(i) {
        settings.quantilesToDisplay.splice(i, 1);
        Game.UpdateMenu();
    }
    function customOptionsMenu() {
        let menuStr = "";
        for (let i = 0; i < settings.quantilesToDisplay.length; i++) {
            menuStr += '<div class="listing">' +
                makeQuantileSlider(i) +
                `<div style="display:inline; vertical-align:top;">
                <a class="option" onclick="InsugarTrading.eraseQuantileSlider(${i});">Remove</a>
            </div>` +
                '</div>';
        }
        let length = settings.quantilesToDisplay.length;
        let onclick = `InsugarTrading.settings.quantilesToDisplay[${length}] = 0.5`;
        menuStr += `<div class="listing">
        <a class="option" onclick="${onclick};Game.UpdateMenu()">Add quantile</a>
        </div>`;
        CCSE.AppendCollapsibleOptionsMenu("Insugar Trading", menuStr);
    }

    /* Reassigned on launch();
     * Game.Objects['Bank'].minigame may not be available when the mod launches,
     * so the following assignment keeps TypeScript happy,
     * and then we use setMinigame assign again when the minigame is loaded to make things work.
     */
    let minigame = Game.Objects['Bank'].minigame;
    function setMinigame() {
        minigame = Game.Objects['Bank'].minigame;
    }
    function getBankLevel() {
        return Game.Objects['Bank'].level;
    }
    function getGoodsCount() {
        if (Game.Objects['Bank'].minigameLoaded)
            return minigame.goodsById.length;
        else
            return 0;
    }

    /* Functions to produce the visualizations for the dataset
     */
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
    function SVGHistogram(bankLevel, goodId, options = {}) {
        if (!isDataAvailable(bankLevel, goodId))
            return '';
        if (!options.additionalLines) {
            options.additionalLines = [];
        }
        let graphWidth = 430, graphHeight = 240, axesMargin = 15, bottomMargin = 20;
        if (options.additionalLines.length != 0)
            bottomMargin += 35;
        let str = `<svg width="${graphWidth + 2 * axesMargin}px" height="${graphHeight + bottomMargin}px">`;
        // We ignore the top margin
        let quantileThreshold = 0.99999;
        let upperPriceBound;
        if (options.forceUpperBound) {
            upperPriceBound = options.forceUpperBound;
        }
        else {
            upperPriceBound = data[bankLevel].map((_, id) => quantile(bankLevel, id, quantileThreshold)).reduce((a, b) => Math.max(a, b));
        }
        // This way, every graph has the same scale and nicely fits between 0 and upperPriceBound.
        let entryCount = data[bankLevel][goodId].length;
        let density = partialSums[bankLevel][goodId][entryCount] / 100;
        /* This way, a stock that is uniformly distributed over a range of $10
         * would form a rectangle whose height is the entire range. */
        // Draw axes
        str += `<path d="M ${axesMargin} 0 v ${graphHeight} h ${axesMargin + graphWidth}"`
            + ' stroke="white" fill="none" />';
        // One axis tick every $10
        for (let t = 0; t < upperPriceBound; t += 10) {
            let x = t / upperPriceBound * graphWidth + axesMargin;
            str += `<line x1="${x}" y1="${graphHeight - 2}" x2="${x}" y2="${graphHeight + 2}" stroke="white" />`;
            // One label every $50
            if (t % 50 === 0) {
                str += `<text x="${x}" y="${graphHeight + 10}" text-anchor="middle" dominant-baseline="middle" fill="white">$${t}</text>`;
            }
        }
        // Draw the histogram
        str += `<path d="M ${axesMargin} ${graphHeight} `;
        for (let i = 0; i < 10 * upperPriceBound; i++) {
            if (i > 0)
                str += 'h ' + (graphWidth / 10 / upperPriceBound) + ' ';
            let barHeight = rawFrequency(bankLevel, goodId, i) / density * graphHeight;
            str += 'V ' + (graphHeight - barHeight) + ' ';
        }
        str += ' Z" fill="steelblue" />';
        // Draw each additional line
        for (let q of options.additionalLines) {
            let value = quantile(bankLevel, goodId, q);
            let x = value / upperPriceBound * graphWidth + axesMargin;
            let frequency = rawFrequency(bankLevel, goodId, Math.floor(10 * value));
            let y = (1 - frequency / density) * graphHeight;
            str += `<line x1="${x}" y1="${y}" x2="${x}" y2="${graphHeight}" stroke="white" />`;
            str += `<text x="${x}" y="${graphHeight + 25}" text-anchor="end" transform="rotate(-45 ${x} ${graphHeight + 25})" fill="white">$${Math.floor(100 * value) / 100}</text>`;
        }
        /* Draw an orange line with the current price
         * Must be drawn last to not be under the adittional lines
         */
        if (options.currentValue) {
            let x = options.currentValue / upperPriceBound * graphWidth + axesMargin;
            let frequency = rawFrequency(bankLevel, goodId, Math.floor(10 * options.currentValue));
            let y = (1 - frequency / density) * graphHeight;
            str += `<line x1="${x}" y1="${y}" x2="${x}" y2="${graphHeight}" stroke="orange" stroke-width="3px"/>`;
        }
        // Draw the name of the stock in the top right corner
        if (options.displayName) {
            str += `<text x="${graphWidth + axesMargin}" y="${axesMargin}" text-anchor="end"` +
                ` dominant-baseline="hanging" fill="white" font-size="x-large">` +
                minigame.goodsById[goodId].symbol +
                '</text>';
        }
        str += '</svg>';
        return str;
    }

    /* Code to show the dataset to players.
     * Note that the Options submenu is maintained in settings.ts.
     */
    /* Creates a new row in each of the good-displaying boxes, right above the stock count.
     * Each box has the text "Quantile: " followed by a div with id 'quantile-0', 'quantile-1' etc.
     * Since this method is called precisely once after the minigame loads,
     * the ids are reliable and are used e.g. by updateQuantileText.
     */
    function createQuantileRows() {
        for (let i = 0; i < getGoodsCount(); i++) {
            let upperBox = document.getElementById('bankGood-' + i).firstChild;
            let stockCounterDiv = document.getElementById('bankGood-' + i + '-stockBox');
            let quantileDiv = upperBox.insertBefore(document.createElement("div"), stockCounterDiv);
            // Copy the style from the other div, because assigning quantileDiv.style don't work
            for (let key of stockCounterDiv.style) {
                quantileDiv.style[key] = stockCounterDiv.style[key];
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
    function interestingness(stockQuantile, purchasedPercent) {
        return purchasedPercent * stockQuantile + (1 - purchasedPercent) * (1 - stockQuantile);
    }
    /* Updates the text inside the row created by createQuantileRows.
     * The signature is appropriate for Game.customMinigame.Bank.buyGood and sellGood.
     */
    function updateQuantileText(id) {
        let lvl = getBankLevel();
        let div = document.getElementById('quantile-' + id);
        if (!isDataAvailable(lvl, id)) {
            div.innerHTML = 'no data';
            div.style.color = '';
            div.style.fontWeight = '';
        }
        else {
            let good = minigame.goodsById[id];
            let value = good.val;
            let ownPercentage = good.stock / minigame.getGoodMaxStock(good);
            let q = inverseQuantile(lvl, id, value);
            div.innerHTML = (Math.floor(10000 * q) / 100) + '%';
            let intr = interestingness(q, ownPercentage);
            div.style.fontWeight = (intr > 0.5 ? 'bold' : '');
            // Makeshift color interpolation from gray to orange
            div.style.color = 'rgba(255, ' + // red
                (165 + (1 - intr) * 90) + ', ' + // green
                ((1 - intr) * 255) + ', ' + // blue
                (0.7 + 0.3 * intr) + ')'; // alpha
        }
    }
    function customGoodTooltip(id, str) {
        str += '<div class="line"></div>';
        let lvl = getBankLevel();
        let currentValue = minigame.goodsById[id].val;
        let additionalLines = settings.quantilesToDisplay;
        if (isDataAvailable(lvl, id)) {
            str += SVGHistogram(lvl, id, { currentValue, additionalLines });
        }
        else {
            str += 'InsugarTrading: No data available.';
        }
        return str;
    }
    function customTickDisplayData() {
        // We're relying on getGoodsCount() == 0 if the minigame hasn't loaded
        for (let i = 0; i < getGoodsCount(); i++) {
            updateQuantileText(i);
        }
    }

    /* Defines the metadata used e.g. in `Game.registerMod`.
     */
    const name = "Insugar Trading";
    const version = version$1; // Semantic versioning
    const GameVersion = "2.031";
    const CCSEVersion = "2.026";
    let isLoaded = false;
    function save() {
        return JSON.stringify({
            version: version,
            settings: settings,
        });
    }
    function load(str) {
        let obj = JSON.parse(str);
        if ('quantilesToDisplay' in obj.settings ?? {}) {
            settings.quantilesToDisplay = obj.settings.quantilesToDisplay;
        }
        /* In every load,
         * stockMarket.js first creates a brand new stock market and simulates 15 ticks of it
         * before overriding the data with what was in the save game.
         * So we must make sure that InsugarTrading.customTickDisplayData is called after the override.
         *
         * Hooks installed by InsugarTrading.init take care of calling this function
         * if the minigame hasn't loaded yet when InsugarTrading.load() is called.
         */
        customTickDisplayData();
    }
    function init() {
        CCSE.MinigameReplacer(function () {
            // These statements require access to the stock market to work
            setMinigame();
            createQuantileRows();
            onDatasetLoad.push(customTickDisplayData);
            fetchDataset(getBankLevel());
        }, 'Bank');
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
        if (!Game.customMinigame['Bank'].tick)
            Game.customMinigame['Bank'].tick = [];
        Game.customMinigame['Bank'].tick.push(customTickDisplayData);
        if (!Game.customMinigame['Bank'].buyGood)
            Game.customMinigame['Bank'].buyGood = [];
        Game.customMinigame['Bank'].buyGood.push(updateQuantileText);
        if (!Game.customMinigame['Bank'].sellGood)
            Game.customMinigame['Bank'].sellGood = [];
        Game.customMinigame['Bank'].sellGood.push(updateQuantileText);
        if (!Game.customMinigame['Bank'].goodTooltip)
            Game.customMinigame['Bank'].goodTooltip = [];
        Game.customMinigame['Bank'].goodTooltip.push(customGoodTooltip);
        Game.customStatsMenu.push(function () {
            CCSE.AppendStatsVersionNumber(name, version);
        });
        Game.customOptionsMenu.push(customOptionsMenu);
        Game.Notify('Insugar Trading loaded!', '', undefined, 1, true);
        isLoaded = true;
    }

    /* The exports of this file construct the "InsugarTrading" object.
     */

    var InsugarTrading = {
        __proto__: null,
        name: name,
        version: version,
        GameVersion: GameVersion,
        CCSEVersion: CCSEVersion,
        init: init,
        load: load,
        save: save,
        get isLoaded () { return isLoaded; },
        settings: settings,
        data: data,
        quantile: quantile,
        inverseQuantile: inverseQuantile,
        averagePrice: averagePrice,
        onDatasetLoad: onDatasetLoad,
        isDataAvailable: isDataAvailable,
        partialSums: partialSums,
        fetchDataset: fetchDataset,
        eraseQuantileSlider: eraseQuantileSlider,
        quantileSliderCallback: quantileSliderCallback
    };

    /* This file makes sure that CCSE loads,
     * that InsugarTrading is available as a global object,
     * and `Game.registerMod`s it.
     */
    window.InsugarTrading = InsugarTrading;
    if (typeof CCSE == 'undefined')
        Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
    if (!isLoaded) {
        let id = 'Insugar Trading';
        if (window.CCSE && window.CCSE.isLoaded) {
            Game.registerMod(id, InsugarTrading);
        }
        else {
            if (!window.CCSE)
                window.CCSE = {};
            if (!window.CCSE.postLoadHooks)
                window.CCSE.postLoadHooks = [];
            window.CCSE.postLoadHooks.push(function () {
                if (window.CCSE.ConfirmGameVersion(name, version, GameVersion)) {
                    Game.registerMod(id, InsugarTrading);
                }
            });
        }
    }

}));
