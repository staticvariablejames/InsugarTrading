var InsugarTrading = {};
// 'var' used here to avoid syntax errors if this script is loaded more than once
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
// CCSE calls Game.Win('Third-party') for us

InsugarTrading.minigame = null; // Set to Game.Objects['Bank'].minigame on InsugarTrading.launch()
InsugarTrading.isGatheringData = false;
InsugarTrading.tickCount = 0;

/* InsugarTrading.data is initialized by InsugarTrading.startDataCollection().
 * The data here is just a histogram:
 * data[id][value] is the number of times that the id-th stock
 * (as listed by Game.Objects['Bank'].goodsById)
 * had its price between value/10 (inclusive) and value/10+1 (exclusive).
 * So this histogram goes in 10-cents increments.
 */
InsugarTrading.data = null;

/* Makeshift tool to tick the stock market more often than what the game could normally do.
 * The fast ticker kills itself once InsugarTrading.isGatheringData is set to false.
 */
InsugarTrading.fastTicker = {};
InsugarTrading.fastTicker.ticksPerCall = 100;
InsugarTrading.fastTicker.intervalID = undefined;
InsugarTrading.fastTicker.start = function() {
    InsugarTrading.minigame.secondsPerTick = 1e300; // kludge
    /* Setting secondsPerTick to a very large number
     * effectively prevents the stock market from ticking "naturally" again.
     * The goal is to prevent issues with reentrancy,
     * i.e. the natural tick being interrupted by a forced tick from this object.
     * (I don't even know if this is a possibility with Javascript
     * but I wanted to be sure.)
     */

    this.intervalID = window.setInterval(this.tickSeveralTimes.bind(this), 1000);
}
InsugarTrading.fastTicker.tickSeveralTimes = function() {
    let beginTime = Date.now();
    for(let i = 0; i < this.ticksPerCall; i++) {
        if(!InsugarTrading.isGatheringData) this.stop();
        InsugarTrading.minigame.tick();
    }
    let endTime = Date.now();
    if(endTime - beginTime < 800) { // less than 800ms
        this.ticksPerCall *= 1.2; // speed up
    }
}
InsugarTrading.fastTicker.stop = function() {
    // Reset stuff
    window.clearInterval(this.intervalID);
    this.ticksPerCall = 100;
    InsugarTrading.minigame.secondsPerTick = 60;
}

/* InsugarTrading.launch() makes sure this function runs every time the stock market ticks. */
InsugarTrading.customTick = function() {
    if(!InsugarTrading.isGatheringData) return;
    for(let id = 0; id < InsugarTrading.data.length; id++) {
        let value = InsugarTrading.minigame.goodsById[id].val;
        value = Math.floor(10*value);
        InsugarTrading.data[id][value]++;
    }
    InsugarTrading.tickCount++;
}

InsugarTrading.startDataCollection = function() {
    InsugarTrading.data = new Array(InsugarTrading.minigame.goodsById.length);
    for(let id = 0; id < InsugarTrading.data.length; id++) {
        InsugarTrading.data[id] = new Array(3000);
        for(let value = 0; value < InsugarTrading.data[id].length; value++)
            InsugarTrading.data[id][value] = 0;
    }

    InsugarTrading.tickCount = 0;
    InsugarTrading.isGatheringData = true;
    InsugarTrading.fastTicker.start();
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
