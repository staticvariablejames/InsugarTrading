# Changelog

## Unreleased
- Changed: the changelog is now in its own file,
    rather than being part of `README.md`.

## 1.4.0 - 2021-10-01
- Changed: Several internal changes, but (hopefully) no externally visible ones.
- Changed: Ported the mod to TypeScript,
    and added a more robust test suite.
- **Removed**: tools for generating the dataset in-game.
    The existence of [CCCPP](https://github.com/staticvariablejames/CookieClickerCppTools)
    makes them redundant for vanilla Stock market,
    and if it is ever needed for modded content,
    it should be rewritten using e.g. [Playwright](https://playwright.dev/)
    or [Cookie Connoisseur](https://github.com/staticvariablejames/cookie-connoisseur).

## 1.3.6 - 2021-09-08
- Changed: Update to CCSE 2.026.
- Changed: The mod won't check the CCSE version anymore.
    (Reasoning: currently CCSE updates far more frequently that Choose Your Own Lump,
    and usually in a backwards-compatible manner.
    Not asking CCSE version every time makes the mod a bit more future-proof.)

## 1.3.5 - 2021-09-02
- Changed: Update to CCSE 2.025.

## 1.3.4 - 2021-03-27
- Changed: Update to CCSE 2.023.

## 1.3.3 - 2020-12-01
- Changed: Update to CCSE 2.021 and display a notification on load.

## 1.3.2 - 2020-11-28
- Fixed: a typo that ate the orange line in the histogram.

## 1.3.1 - 2020-11-25
- Added: Bank levels between 1 and 50 are available,
    including Subsidiaries (Idleverses).
- Changed: Datasets replaced with datasets computed with
    [Cookie Clicker C++ Tools](https://github.com/staticvariablejames/CookieClickerCppTools).

## 1.3.0 - 2020-11-08
- Changed: Minor change in graph style.
- Added: The graph now has vertical lines displaying specific quantiles.

## 1.2.5 - 2020-11-02
- Added: Register the mod in the game's modding API.

## 1.2.4 - 2020-11-01
- Fixed: a typo in the histogram generation code.

## 1.2.3 - 2020-11-01
- Changed: Update to Cookie Clicker v2.031.
- **Known issue**: The datasets for the new building still need to be computed.

## 1.2.2 - 2020-10-07
- Changed: Use CCSE v2.018.

## 1.2.1 - 2020-10-06
- Fixed: a bug in which tooltip information would appear twice
    after a wipe save (hard reset).

## 1.2.0 - 2020-09-23
- Changed: The 4.7M dataset was split in files of around 150K each
    (one for each bank level);
    only the needed datasets are downloaded.
    This should ease the burden on slower connections and speed up loading the mod.
- Changed: Minor improvements on the histogram display.

## 1.1.2 - 2020-11-21
- Added: datasets for bank levels up to 30.
- Added: Display the mod's version number in the stats menu.

## 1.1.1 - 2020-09-14
- Fixed: a performance bug when collecting data.

## 1.1.0 - 2020-09-14
- Change: Move the 1.4MB dataset to its own file.

## 1.0.0 - 2020-09-13
- Initial release.
