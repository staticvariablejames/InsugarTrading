/* The exports of this file construct the "InsugarTrading" object.
 */

export { name, version, GameVersion, CCSEVersion, init, load, save, isLoaded } from './mod';

// API
export { settings } from './settings';
export { data, quantile, inverseQuantile, averagePrice, onDatasetLoad, isDataAvailable } from './dataset';

// Mostly testing
export { partialSums, fetchDataset } from './dataset';

// Needed for the UI
export { eraseQuantileSlider, quantileSliderCallback } from './settings';
