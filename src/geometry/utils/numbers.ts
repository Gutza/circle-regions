const decimals = 10;

/**
 * Round a floating point number to a safe number of decimals.
 * @param n The number to round.
 */
export const round = (number: number, precision: number = decimals) => {
	if (precision <= 0.1) {
		return Math.round(number);
	}
    const pow = Math.pow(number, precision);
    if (isFinite(pow)) {
        return Math.round(pow)/precision;
    }

    // The current lodash.round function
    let pair = `${number}e`.split('e')
    const value = Math.round(+`${pair[0]}e${+pair[1] + precision}`)

    pair = `${value}e`.split('e')
    return +`${pair[0]}e${+pair[1] - precision}`
};
