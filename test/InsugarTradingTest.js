// Load this file as a mod after InsugarTrading.js, without loading any datasets

console.log("Running tests...");

let almostEqual = function(a, b) {
    return Math.abs(a-b) < 1e-10;
}

// Testing dataset
InsugarTrading.tickCount = 20;
InsugarTrading.data = [
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
    [ 0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
];

console.assert(InsugarTrading.data.length === 16); // Testing the test
console.assert(InsugarTrading.data[0].length === 12); // Testing the test
// The extra row is to test independence from Game.Objects.Bank.minigame.objectsById.length

InsugarTrading.computePartialSums();

console.assert(InsugarTrading.partialSums !== null);
console.assert(InsugarTrading.partialSums.length === 16);
console.assert(InsugarTrading.partialSums[0].length === 13);
console.assert(InsugarTrading.partialSums[0].join(',') === "0,0,1,3,6,10,14,17,19,20,20,20,20");

console.assert(InsugarTrading.quantile(0, -1) === -Infinity);
console.assert(InsugarTrading.quantile(0, 1.01) === Infinity);
console.assert(almostEqual(InsugarTrading.quantile(0, 0), 0.1));
console.assert(almostEqual(InsugarTrading.quantile(0, 0.025), 0.15));
console.assert(almostEqual(InsugarTrading.quantile(0, 0.0375), 0.175));
console.assert(almostEqual(InsugarTrading.quantile(0, 0.05), 0.2));
console.assert(almostEqual(InsugarTrading.quantile(0, 0.10), 0.25));
console.assert(almostEqual(InsugarTrading.quantile(0, 0.15), 0.3));
console.assert(almostEqual(InsugarTrading.quantile(0, 0.3), 0.4));
console.assert(almostEqual(InsugarTrading.quantile(0, 0.5), 0.5));
console.assert(almostEqual(InsugarTrading.quantile(0, 0.6), 0.55));
console.assert(almostEqual(InsugarTrading.quantile(0, 0.7), 0.6));
console.assert(almostEqual(InsugarTrading.quantile(0, 1), 1.2));

console.assert(InsugarTrading.inverseQuantile(0, -1) === 0);
console.assert(InsugarTrading.inverseQuantile(0, 0) === 0);
console.assert(InsugarTrading.inverseQuantile(0, 1.21) === 1);
console.assert(almostEqual(InsugarTrading.inverseQuantile(0, 0.1), 0));
console.assert(almostEqual(InsugarTrading.inverseQuantile(0, 0.15), 0.025));
console.assert(almostEqual(InsugarTrading.inverseQuantile(0, 0.175), 0.0375));
console.assert(almostEqual(InsugarTrading.inverseQuantile(0, 0.2), 0.05));
console.assert(almostEqual(InsugarTrading.inverseQuantile(0, 0.25), 0.10));
console.assert(almostEqual(InsugarTrading.inverseQuantile(0, 0.3), 0.15));
console.assert(almostEqual(InsugarTrading.inverseQuantile(0, 0.4), 0.3));
console.assert(almostEqual(InsugarTrading.inverseQuantile(0, 0.5), 0.5));
console.assert(almostEqual(InsugarTrading.inverseQuantile(0, 0.55), 0.6));
console.assert(almostEqual(InsugarTrading.inverseQuantile(0, 0.6), 0.7));
console.assert(almostEqual(InsugarTrading.inverseQuantile(0, 1.0), 1));
console.assert(almostEqual(InsugarTrading.inverseQuantile(0, 1.2), 1));

console.log("Testing done!");
