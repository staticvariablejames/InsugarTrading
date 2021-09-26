/* Reassigned on launch();
 * Game.Objects['Bank'].minigame may not be available when the mod launches,
 * so the following assignment keeps TypeScript happy,
 * and then we use setMinigame assign again when the minigame is loaded to make things work.
 */
export let minigame = Game.Objects['Bank'].minigame;

export function setMinigame() {
    minigame = Game.Objects['Bank'].minigame;
}

export function getBankLevel() {
    return Game.Objects['Bank'].level;
}

export function getGoodsCount() {
    if(Game.Objects['Bank'].minigameLoaded)
        return minigame.goodsById.length;
    else
        return 0;
}
