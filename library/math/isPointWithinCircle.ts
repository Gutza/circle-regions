/**
 * Checks if a point is within a circle.
 * @param px The point's x coordinate
 * @param py The point's y coordinate
 * @param cx The circle's x coordinate
 * @param cy The circle's y coordinate
 * @param radius The circle's radius
 * @param padding An optional padding, which effectively extends the radius
 */
function isPointWithinCircle(px: number, py: number, cx: number, cy: number, radius: number, padding: number = 0): boolean {
  let evalRad = radius + padding;

  // First try a quick and dirty evaluation to see if the point is even in the circle's bounding box.
  if (px > cx+evalRad || px < cx-evalRad || py>cy+evalRad || py<cy-evalRad) {
    return false;
  }

  // No joy, we actually have to calculate this properly.
  return ((px - cx) ** 2) + ((py - cy) ** 2) < (evalRad ** 2);
}

export default isPointWithinCircle;
