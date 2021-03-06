// Load this file as a mod after InsugarTrading.js, without loading any datasets

console.log("Running tests...");

var almostEqual = function(a, b) {
    // 'var' to allow reentrancy
    return Math.abs(a-b) < 1e-10;
}

// Testing dataset
let testDataset = [null, [
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 0, 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
],/*empty*/,[
    [ 0, 2, 4, 6, 8, 8, 6, 4, 2],
    /*empty*/,
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1],
],
];

// Mock fetchDataset
InsugarTrading.fetchDataset = function(bankLevel) {
    if(bankLevel in InsugarTrading.data) return;
    if(bankLevel == 1) {
        InsugarTrading.data[1] = testDataset[1];
        for(let f of InsugarTrading.onDatasetLoad) f(1);
    }
    if(bankLevel == 3) {
        InsugarTrading.data[3] = testDataset[3];
        for(let f of InsugarTrading.onDatasetLoad) f(3);
    }
}

console.assert(testDataset[1].length === 16); // Testing the test
// The extra row is to test independence from Game.Objects.Bank.minigame.objectsById.length

// Pretend the bank has level 1
InsugarTrading.getBankLevel = () => 1;
// Pretend there are 16 goods
InsugarTrading.getGoodsCount = () => 16;

// Clear the current dataset
InsugarTrading.data = [null];

InsugarTrading.fetchDataset(1);
// Should call InsugarTrading.computePartialSums

console.assert(InsugarTrading.partialSums !== null);
console.assert(InsugarTrading.partialSums.length === 2);
console.assert(InsugarTrading.partialSums[1].length === 16);
console.assert(InsugarTrading.partialSums[1][0].length === 10);
console.assert(InsugarTrading.partialSums[1][1].length === 11);
console.assert(InsugarTrading.partialSums[1][2].length === 12);
console.assert(InsugarTrading.partialSums[1][0].join(',') === "0,0,1,3,6,10,14,17,19,20");

console.assert(InsugarTrading.quantile(1, 0, -1) === -Infinity);
console.assert(InsugarTrading.quantile(1, 0, 1.01) === Infinity);
console.assert(almostEqual(InsugarTrading.quantile(1, 0, 0), 0.1));
console.assert(almostEqual(InsugarTrading.quantile(1, 0, 0.025), 0.15));
console.assert(almostEqual(InsugarTrading.quantile(1, 0, 0.0375), 0.175));
console.assert(almostEqual(InsugarTrading.quantile(1, 0, 0.05), 0.2));
console.assert(almostEqual(InsugarTrading.quantile(1, 1, 0.05), 0.3));
console.assert(almostEqual(InsugarTrading.quantile(1, 2, 0.05), 0.4));
console.assert(almostEqual(InsugarTrading.quantile(1, 0, 0.10), 0.25));
console.assert(almostEqual(InsugarTrading.quantile(1, 0, 0.15), 0.3));
console.assert(almostEqual(InsugarTrading.quantile(1, 0, 0.3), 0.4));
console.assert(almostEqual(InsugarTrading.quantile(1, 0, 0.5), 0.5));
console.assert(almostEqual(InsugarTrading.quantile(1, 0, 0.6), 0.55));
console.assert(almostEqual(InsugarTrading.quantile(1, 0, 0.7), 0.6));
console.assert(almostEqual(InsugarTrading.quantile(1, 1, 0.7), 0.7));
console.assert(almostEqual(InsugarTrading.quantile(1, 2, 0.7), 0.8));
console.assert(almostEqual(InsugarTrading.quantile(1, 0, 1), 0.9));
console.assert(almostEqual(InsugarTrading.quantile(1, 1, 1), 1.0));
console.assert(almostEqual(InsugarTrading.quantile(1, 2, 1), 1.1));
console.assert(InsugarTrading.quantile(0, 0, 0.5) === null);
console.assert(InsugarTrading.quantile(1, 17, 0.5) === null);

console.assert(InsugarTrading.inverseQuantile(1, 0, -1) === 0);
console.assert(InsugarTrading.inverseQuantile(1, 0, 0) === 0);
console.assert(InsugarTrading.inverseQuantile(1, 0, 1.21) === 1);
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 0, 0.1), 0));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 0, 0.15), 0.025));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 0, 0.175), 0.0375));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 0, 0.2), 0.05));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 0, 0.25), 0.10));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 0, 0.3), 0.15));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 1, 0.4), 0.15));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 2, 0.5), 0.15));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 0, 0.4), 0.3));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 0, 0.5), 0.5));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 0, 0.55), 0.6));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 0, 0.6), 0.7));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 1, 0.7), 0.7));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 2, 0.8), 0.7));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 0, 1.0), 1));
console.assert(almostEqual(InsugarTrading.inverseQuantile(1, 0, 1.2), 1));
console.assert(InsugarTrading.inverseQuantile(0, 0, 0.5) === null);
console.assert(InsugarTrading.inverseQuantile(1, 17, 0.5) === null);

// Test whether everything works with incomplete datasets
console.assert(!InsugarTrading.isDataAvailable(2, 0));
console.assert(!InsugarTrading.isDataAvailable(3, 0)); // First call is false
console.assert(InsugarTrading.isDataAvailable(3, 0)); // Second call is true, as data already loaded
console.assert(!InsugarTrading.isDataAvailable(3, 1));
console.assert(InsugarTrading.isDataAvailable(3, 2));
console.assert(almostEqual(InsugarTrading.inverseQuantile(3, 0, 0.2), 0.05));
console.assert(almostEqual(InsugarTrading.inverseQuantile(3, 2, 0.2), 0.05));

console.assert(almostEqual(InsugarTrading.averagePrice(1, 0), 0.5));
console.assert(almostEqual(InsugarTrading.averagePrice(1, 1), 0.6));
console.assert(almostEqual(InsugarTrading.averagePrice(1, 2), 0.7));
console.assert(InsugarTrading.averagePrice(0, 0) === null);
console.assert(InsugarTrading.averagePrice(1, 17) === null);

console.log("Testing done!");
