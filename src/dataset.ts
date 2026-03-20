/* Utilities for fetching and querying the dataset.
 */

/* The data here is just a histogram:
 * data[bankLvl][dragonBoost][id][value] is the number of times that the id-th stock
 * (as listed by Game.Objects['Bank'].goodsById)
 * had its price between value/10 (inclusive) and value/10+1 (exclusive),
 * while the Bank building had the level bankLvl
 * and Game.auraMult('Supreme Intellect') was dragonBoost.
 * So this histogram goes in 10-cents increments.
 *
 * The file main.ts makes sure that the array below
 * is globally available as window.InsugarTrading.data;
 * this allows the files data/lvl1.ts through data/lvl50.js to populate it.
 */
export const data: {[dragonBoost: number]: number[][]}[] = [];

export function datasetUrl(bankLevel: number) {
    return 'https://staticvariablejames.github.io/InsugarTrading/data/lvl' + bankLevel + '.js';
}

export const highestAvailableDatasetLevel = 50;

/* Downloads a dataset from the github website.
 *
 * Nothing happens if the data cannot be made available,
 * or if the respective dataset was already requested.
 *
 * Whenever a dataset for a certain bank level is loaded,
 * all functions in onDatasetLoad are called,
 * passing the bank level of the newly available dataset as argument.
 */
export const onDatasetLoad: ((bankLevel: number) => void)[] = [];
export function fetchDataset(bankLevel: number) {
    if(bankLevel <= 0 || bankLevel > highestAvailableDatasetLevel) return;
    if(bankLevel in data) return; // Dataset already fetched

    data[bankLevel] = {}; // Simple way of marking that a fetch request was issued

    // The following code duplicates part of Game.LoadMod,
    // but ensuring to call all functions of onDatasetLoad.
    let script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', datasetUrl(bankLevel));
    script.onload = function() {
        for(let f of onDatasetLoad) {
            f(bankLevel);
        }
    }
    document.head.appendChild(script);
}

/* Generates a dataset with triangular distribution between $0+id and $100+id, and median $50+id.
 * This is used for testing.
 */
export function makeTestingTriangularDistribution() {
    const highestId = 17;
    for(let lvl = 1; lvl <= highestAvailableDatasetLevel; lvl++) {
        data[lvl] = {0.0: [], 0.1: [], 1.0: [], 1.1: []};
        for(let boost in data[lvl]) {
            for(let id = 0; id <= highestId; id++) {
                data[lvl][boost][id] = Array(1000+10*id);
                for(let i = 0; i < 10*id; i++) {
                    data[lvl][boost][id][i] = 0;
                }
                for(let i = 0; i < 500; i++) {
                    data[lvl][boost][id][i + 10*id] = 2*i+1;
                }
                for(let i = 0; i < 500; i++) {
                    data[lvl][boost][id][i+500 + 10*id] = 1000-(2*i+1);
                }
            }
        }
        for(let f of onDatasetLoad) {
            f(lvl);
        }
    }
}

export function isDataAvailable(bankLevel: number, dragonBoost: number, goodId: number) {
    if(!(bankLevel in data)) return false;
    if(!(dragonBoost in data[bankLevel])) return false;
    if(!(goodId in data[bankLevel][dragonBoost])) return false;
    return true;
}

/* Returns data[bankLevel][dragonBoost][goodId][value] if available.
 * If !isDataAvailable(bankLevel, goodId), returns null.
 * If data is available but the value is out of range, returns 0,
 * which is actually what "frequency" means in this case.
 */
export function rawFrequency(bankLevel: number, dragonBoost: number, goodId: number, value: number): number | null {
    if(!isDataAvailable(bankLevel, dragonBoost, goodId)) {
        return null;
    }
    let a = data[bankLevel][dragonBoost][goodId];
    if(value < 0 || value >= a.length) {
        return 0;
    }
    return a[value];
}

/* partialSums[lvl][boost][id] contains the partial sums of data[lvl][boost][id].
 * More specifically, partialSums[lvl][boost][id][value]
 * is the sum of partialSums[lvl][boost][id][v] for v = 0,...,value-1.
 * So, for example,
 * partialSums[lvl][boost][id].length === data[lvl][boost][id].length + 1.
 *
 * It is computed by computePartialSums right after the dataset is loaded,
 * so whenever isDataAvailable(lvl, boost, id) is true
 * the partial sums are available.
 */
export const partialSums: {[dragonBoost: number]: number[][]}[] = [];

/* Compute the partial sums for the given bank level,
 * overriding the current partialSums data if any.
 */
function computePartialSums(lvl: number) {
    partialSums[lvl] = [];
    for(let boost of [0.0, 0.1, 1.0, 1.1]) {
        partialSums[lvl][boost] = [];
        for(let id in data[lvl][boost]) {
            partialSums[lvl][boost][id] = new Array(data[lvl][boost][id].length + 1);
            partialSums[lvl][boost][id][0] = 0;
            for(let v = 0; v < data[lvl][boost][id].length; v++) {
                // This is the only step where we actually need the numerical index
                partialSums[lvl][boost][id][v+1] = partialSums[lvl][boost][id][v] + data[lvl][boost][id][v];
            }
        }
    }
}
onDatasetLoad.push(computePartialSums);

/* The quantile function.
 * Returns a value such that the given fraction of the values in the histogram are smaller than it
 * and 1-fraction of the values in the histogram are higher than it.
 *
 * For example, `valueOfQuantile(1, 0, 0, 0.5)` (the fraction being 0.5)
 * is the median value attained by the first good with no dragon auras and bank level 1,
 * and `valueOfQuantile(1, 0, 0, 0.75)` is the upper quartile.
 * This function is an inverse of the cumulative distribution function (`quantileOfValue` below).
 *
 * A linear approximation is used inside each bin of the histogram.
 *
 * If more than one value is valid, the largest one is returned.
 *
 * If there is no available data, it returns null.
 */
export function valueOfQuantile(bankLevel: number, dragonBoost: number, goodId: number, fraction: number) {
    if(!isDataAvailable(bankLevel, dragonBoost, goodId)) return null;

    if(fraction < 0) return -Infinity;
    if(fraction > 1) return Infinity;

    // Binary search, Hermann Bottenbruch version. i is a lower bound, j is an upper bound
    let a = partialSums[bankLevel][dragonBoost][goodId];
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
        estimatedQuantile += excess/data[bankLevel][dragonBoost][goodId][i]/10;
        /* This 'if' prevents a possible division by zero if InsugarTrading.data[goodId][i] === 0
         * It also can never execute if i === InsugarTrading.data[goodId].length,
         * because this would force excess to be 0.
         */
    }
    return knownQuantile + estimatedQuantile;
}

/* The cumulative distribution function (CDF).
 * Returns the proportion of values in the histogram which are smaller than the given value.
 * The result is a value between 0 and 1 (inclusive).
 *
 * This function is an inverse of the quantile function (`valueOfQuantile` above).
 *
 * A linear approximation is used inside each bin of the histogram.
 *
 * If there is no available data, it returns null.
 */
export function quantileOfValue(bankLevel: number, dragonBoost: number, goodId: number, targetValue: number) {
    if(!isDataAvailable(bankLevel, dragonBoost, goodId)) return null;

    let value = 10 * targetValue; // The histogram works in increments of 0.1
    if(value <= 0) return 0;
    if(value >= data[bankLevel][dragonBoost][goodId].length) return 1;

    let sum = partialSums[bankLevel][dragonBoost][goodId];
    let knownToBeSmaller = sum[Math.floor(value)];
    let fraction = value - Math.floor(value);
    // linear approximation inside the bin number Math.floor(value)
    let estimatedToBeSmaller = fraction * data[bankLevel][dragonBoost][goodId][Math.floor(value)];
    return (knownToBeSmaller + estimatedToBeSmaller)/sum[sum.length-1];
}

/* Computes the average price for the given good in the dataset.
 *
 * A linear approximation is used inside each bin.
 */
export function averagePrice(bankLevel: number, dragonBoost: number, goodId: number) {
    if(!isDataAvailable(bankLevel, dragonBoost, goodId)) return null;
    let sum = 0;
    let observations = 0;
    for(let i = 0; i < data[bankLevel][dragonBoost][goodId].length; i++) {
        sum += (i/10+0.05) * data[bankLevel][dragonBoost][goodId][i];
        observations += data[bankLevel][dragonBoost][goodId][i];
    }
    return sum/observations;
}
