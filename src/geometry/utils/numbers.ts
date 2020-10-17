const lodashRound = require('lodash.round');
/**
 * Round a floating point number to a safe number of decimals.
 * @param n The number to round.
 */

export const round = (n: number) => lodashRound(n, 10);