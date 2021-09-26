/* This file makes sure that CCSE loads,
 * that InsugarTrading is available as a global object,
 * and `Game.registerMod`s it.
 */
import * as InsugarTrading from './index';

declare global {
    interface Window {
        InsugarTrading: typeof InsugarTrading;
    }
}

window.InsugarTrading = InsugarTrading;

if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');

if(!InsugarTrading.isLoaded){
    let id = 'Insugar Trading';
    if(window.CCSE && window.CCSE.isLoaded){
        Game.registerMod(id, InsugarTrading);
    }
    else {
        if(!window.CCSE) window.CCSE = ({} as typeof CCSE);
        if(!window.CCSE.postLoadHooks) window.CCSE.postLoadHooks = [];
        window.CCSE.postLoadHooks.push(function() {
            if(window.CCSE.ConfirmGameVersion(InsugarTrading.name, InsugarTrading.version, InsugarTrading.GameVersion)) {
                Game.registerMod(id, InsugarTrading);
            }
        });
    }
}
