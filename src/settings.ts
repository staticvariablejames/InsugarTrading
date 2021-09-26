/* Houses the settings object
 * and the code that creates the submenu in Options.
 */

export let settings = { // default settings
    quantilesToDisplay: [0.25, 0.5, 0.75],
};

export function quantileSliderCallback(i: number) {
    let slider = document.getElementById('InsugarTradingQuantileSlider' + i) as HTMLInputElement;
    let value = slider?.value ?? 50;
    settings.quantilesToDisplay[i] = Number(value)/100;
    document.getElementById(`InsugarTradingQuantileSlider${i}RightText`)!.innerHTML = value + '%';
}

// Makes a slider for index i of InsugarTrading.settings.quantilesToDisplay
export function makeQuantileSlider(i: number) {
    return Game.WriteSlider(
        'InsugarTradingQuantileSlider' + i,
        'Quantile',
        '[$]%',
        () => Math.round(settings.quantilesToDisplay[i]*100),
        'InsugarTrading.quantileSliderCallback(' + i + ')'
    );
}

export function eraseQuantileSlider(i: number) {
    settings.quantilesToDisplay.splice(i, 1);
    Game.UpdateMenu();
}

export function customOptionsMenu() {
    let menuStr = "";
    for(let i = 0; i < settings.quantilesToDisplay.length; i++) {
        menuStr += '<div class="listing">' +
            makeQuantileSlider(i) +
            `<div style="display:inline; vertical-align:top;">
                <a class="option" onclick="InsugarTrading.eraseQuantileSlider(${i});">Remove</a>
            </div>` +
        '</div>';
    }

    let length = settings.quantilesToDisplay.length;
    let onclick = `InsugarTrading.settings.quantilesToDisplay[${length}] = 0.5`;
    menuStr += `<div class="listing">
        <a class="option" onclick="${onclick};Game.UpdateMenu()">Add quantile</a>
        </div>`;
    CCSE.AppendCollapsibleOptionsMenu("Insugar Trading", menuStr);
}
