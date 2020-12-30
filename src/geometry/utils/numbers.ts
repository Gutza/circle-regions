import { ERoundingSize } from "../../Types";

const lodashRound = require('lodash.round');

var digits: number = 5;

const roundingPresets: Map<ERoundingSize, number> = new Map([
    [ERoundingSize.default, 5],
    [ERoundingSize.large, 2],
    [ERoundingSize.small, 8],
]);

/**
 * You typically shouldn't need to change this for most cases.
 * Use it in extreme cases to a preset value among the ERoundingSize
 * enum, or use a specific number of decimals if you need extra control.
 * Call it without parameters to reset rounding to the factory default.
 * Counter-intuitively, you can set negative numbers; see lodash.round for details.
 * @param factor The rounding factor.
 */
export const setRounding = (factor: number | ERoundingSize = ERoundingSize.default) => {
    if (typeof(factor) == "number") {
        digits = factor;
        return;
    }

    if (roundingPresets.has(factor)) {
        digits = roundingPresets.get(factor) as number;
        return;
    }

    throw new Error("Unknown rounding preset «"+ factor +"»");
}

/**
 * Round a floating point number to a safe number of decimals.
 * @param n The number to round.
 */
export const round = (n: number) => lodashRound(n, digits);