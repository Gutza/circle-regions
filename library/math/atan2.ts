/**
 * Calculate the angle between the x axis and a segment defined by its start and end coordinates.
 * Reliably returns values between 0 and 2*PI (or between -PI and PI, if normalization is not requested).
 * @param x1 The first point's x coordinate
 * @param y1 The first point's y coordinate
 * @param x2 The second point's x coordinate
 * @param y2 The second point's y coordinate
 * @param normalise Normalize the resulting angle, ensuring it's always positive. Defaults to true.
 */
function atan2(x1: number, y1: number, x2: number, y2: number, normalise = true) {
  let a = Math.atan2(y1 - y2, x1 - x2);
  if (normalise && a < 0) a += Math.PI * 2;
  return a;
}

export default atan2;

