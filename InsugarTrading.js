var InsugarTrading = {};

InsugarTrading.setupAnalysis = function() {
    InsugarTrading.minigame = Game.Objects['Bank'].minigame;
    InsugarTrading.values = new Array(InsugarTrading.minigame.goodsById.length);
    for(let i = 0; i < InsugarTrading.values.length; i++) {
        InsugarTrading.values[i] = new Array(3000);
        for(let j = 0; j < InsugarTrading.values[i].length; j++)
            InsugarTrading.values[i][j] = 0;
    }

    InsugarTrading.tickCount = 0;

    // CCSE hook
    Game.customMinigame['Bank'].tick.push(function() {
        for(let i = 0; i < InsugarTrading.values.length; i++) {
            let value = InsugarTrading.minigame.goodsById[i].val;
            value = Math.floor(10*value);
            InsugarTrading.values[i][value]++;
        }
        InsugarTrading.tickCount++;
    });
}
