/* Houses the settings object
 * and the code that creates the submenu in Options.
 */

export let settings = { // default settings
    attentionThreshold: 0.75,
    autohideUninterestingGoods: false,
    quantilesToDisplay: [0.25, 0.5, 0.75],
};

/* Every function here is ran whenever the settings change.
 * This is here primarily to prevent a circular dependency between settings.ts and ui.ts.
 */
export let onSettingsChange: (() => void)[] = [];
function callAllSettingsUpdateCallback() {
    for(let callback of onSettingsChange)
        callback();
}

// While we wait for https://github.com/microsoft/TypeScript/issues/48992
export type booleanKey = {[key in keyof typeof settings]: typeof settings[key] extends boolean ? key : never}[keyof typeof settings & string];

export function toggleSettingCallback(key: booleanKey, description: string) {
    settings[key] = !settings[key];
    let element = document.getElementById('InsugarTrading'+key+'Button')!;
    if(settings[key]) {
        element.classList.remove("off");
        element.innerHTML = description + ' ON';
    } else {
        element.classList.add("off");
        element.innerHTML = description + ' OFF';;
    }
    PlaySound('snd/tick.mp3');
    callAllSettingsUpdateCallback();
}

export function quantileSliderCallback(i: number) {
    let slider = document.getElementById('InsugarTradingQuantileSlider' + i) as HTMLInputElement;
    let value = slider?.value ?? 50;
    settings.quantilesToDisplay[i] = Number(value)/100;
    document.getElementById(`InsugarTradingQuantileSlider${i}RightText`)!.innerHTML = value + '%';
    callAllSettingsUpdateCallback();
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
    callAllSettingsUpdateCallback();
}

export function attentionThresholdSliderCallback() {
    let slider = document.getElementById('InsugarTradingAttentionThresholdSlider') as HTMLInputElement;
    let value = slider?.value ?? 50;
    settings.attentionThreshold = Number(value)/100;
    document.getElementById(`InsugarTradingAttentionThresholdSliderRightText`)!.innerHTML = value + '%';
    callAllSettingsUpdateCallback();
}

export function customOptionsMenu() {
    let menuStr = "";
    menuStr += '<div class="listing">' + Game.WriteSlider(
        'InsugarTradingAttentionThresholdSlider',
        'Attention Threshold',
        '[$]%',
        () => Math.round(settings.attentionThreshold*100),
        'InsugarTrading.attentionThresholdSliderCallback()'
    ) + '</div>';

    // TODO: create a makeButton function or something, especially if we need more buttons
    let onoff = settings.autohideUninterestingGoods;
    menuStr += `<div class="listing"><a id="InsugarTradingautohideUninterestingGoodsButton"
        class="smallFancyButton prefButton option${onoff? "" : " off"}"
        onclick="InsugarTrading.toggleSettingCallback('autohideUninterestingGoods', 'Autohide goods')">
            Autohide goods ${onoff? 'ON': 'OFF'}
        </a>
        <label>On each tick, automatically hide stocks below the attention threshold</label>
        </div>`;

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
