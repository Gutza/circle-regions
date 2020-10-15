/**
 * Round a floating point number to a safe number of decimals.
 * @param n The number to round.
 */
export const round = (number: number) => {
	return Math.fround(number);
};
