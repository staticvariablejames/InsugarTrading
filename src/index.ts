/* The exports of this file construct the "InsugarTrading" object.
 */

export { name, version, GameVersion, CCSEVersion, init, load, save, isLoaded } from './mod';

// API
export { settings } from './settings';
export { data, quantile, inverseQuantile, averagePrice, onDatasetLoad, isDataAvailable, makeTestingTriangularDistribution } from './dataset';

// Mostly testing
export { partialSums, fetchDataset } from './dataset';
export { updateAllQuantileTexts, attentionForQuantile, attentionForStock } from './ui';

// Needed for the UI
export { eraseQuantileSlider, quantileSliderCallback, attentionThresholdSliderCallback } from './settings';
