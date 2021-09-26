/* Defines the metadata used e.g. in `Game.registerMod`.
 */
import { fetchDataset, onDatasetLoad } from './dataset';
import * as package_json from '../package.json'
import { customOptionsMenu, settings } from './settings';
import { createQuantileRows, customGoodTooltip, customTickDisplayData, updateQuantileText } from './ui';
import { getBankLevel, setMinigame } from './util';

export const name = "Insugar Trading";
export const version = package_json.version; // Semantic versioning
export const GameVersion = "2.031";
export const CCSEVersion = "2.026";
export let isLoaded = false;

export function save() {
    return JSON.stringify({
        version: version,
        settings: settings,
    });
}

export function load(str: string) {
    let obj = JSON.parse(str);
    if('quantilesToDisplay' in obj.settings ?? {}) {
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

export function init() {
    CCSE.MinigameReplacer(function(){
        // These statements require access to the stock market to work
        setMinigame();
        createQuantileRows();

        onDatasetLoad.push(customTickDisplayData);
        fetchDataset(getBankLevel());
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
    Game.customMinigame['Bank'].tick.push(customTickDisplayData);

    if(!Game.customMinigame['Bank'].buyGood) Game.customMinigame['Bank'].buyGood = [];
    Game.customMinigame['Bank'].buyGood.push(updateQuantileText);

    if(!Game.customMinigame['Bank'].sellGood) Game.customMinigame['Bank'].sellGood = [];
    Game.customMinigame['Bank'].sellGood.push(updateQuantileText);

    if(!Game.customMinigame['Bank'].goodTooltip) Game.customMinigame['Bank'].goodTooltip = [];
    Game.customMinigame['Bank'].goodTooltip.push(customGoodTooltip);

    Game.customStatsMenu.push(function() {
        CCSE.AppendStatsVersionNumber(name, version);
    });

    Game.customOptionsMenu.push(customOptionsMenu);

    Game.Notify('Insugar Trading loaded!', '', undefined, 1, true);

    isLoaded = true;
}
