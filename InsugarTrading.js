var InsugarTrading = {};
// 'var' used here to avoid syntax errors if this script is loaded more than once
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
// CCSE calls Game.Win('Third-party') for us

InsugarTrading.minigame = null; // Set to Game.Objects['Bank'].minigame on InsugarTrading.launch()
InsugarTrading.isGatheringData = false;
InsugarTrading.tickCount = 0;

InsugarTrading.customTick = function() {
    if(!InsugarTrading.isGatheringData) return;
    for(let i = 0; i < InsugarTrading.values.length; i++) {
        let value = InsugarTrading.minigame.goodsById[i].val;
        value = Math.floor(10*value);
        InsugarTrading.values[i][value]++;
    }
    InsugarTrading.tickCount++;
}

InsugarTrading.startDataCollection = function() {
    InsugarTrading.values = new Array(InsugarTrading.minigame.goodsById.length);
    for(let i = 0; i < InsugarTrading.values.length; i++) {
        InsugarTrading.values[i] = new Array(3000);
        for(let j = 0; j < InsugarTrading.values[i].length; j++)
            InsugarTrading.values[i][j] = 0;
    }

    InsugarTrading.tickCount = 0;
    InsugarTrading.isGatheringData = true;
}

InsugarTrading.launch = function() {
    CCSE.MinigameReplacer(function(){
        InsugarTrading.minigame = Game.Objects['Bank'].minigame;
        Game.customMinigame['Bank'].tick.push(InsugarTrading.customTick);
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
