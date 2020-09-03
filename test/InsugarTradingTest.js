// Load this file as a mod after InsugarTrading.js, without loading any datasets

console.log("Running tests...");

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

console.log("Testing done!");
