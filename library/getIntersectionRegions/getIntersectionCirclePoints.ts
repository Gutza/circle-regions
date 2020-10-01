const floor = require('lodash.floor');
import Circle from './Circle';

const precise = (n: number) => floor(n, 5);

/**
 * Computes the intersection points between two circles. Returns an empty array if the circles don't intersect.
 * @param circle1 The first circle
 * @param circle2 The second circle
 */
const getIntersectionCirclePoints = (circle1: Circle, circle2: Circle):[[number, number], [number, number]] | [] => {
  const { x: x1, y: y1, radius: r1 } = circle1;
  const { x: x2, y: y2, radius: r2 } = circle2;

  const dSquared = (x2-x1)**2 + (y2-y1)**2;
  if (!dSquared || dSquared > (r1+r2)**2 || dSquared < (r2-r1)**2) {
    return [];
  }

  const d = Math.sqrt(dSquared);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);
  const x = x1 + a * (x2 - x1) / d;
  const y = y1 + a * (y2 - y1) / d;
  const rx = -(y2 - y1) * (h / d);
  const ry = -(x2 - x1) * (h / d);
  const p1: [number, number] = [precise(x + rx), precise(y - ry)];
  const p2: [number, number] = [precise(x - rx), precise(y + ry)];

  return [p1, p2];
};

export default getIntersectionCirclePoints;