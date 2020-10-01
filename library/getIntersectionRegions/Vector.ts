import atan2 from '../math/atan2';
import Arc from './Arc';
import Circle from './Circle';

/**
 * In circle-regions, vectors are points of intersection between exactly two circles.
 */
export default class Vector {
  /**
   * This vector's angular position on the first circle.
   */
  angle1: number;

  /**
   * This vector's angular position on the second circle.
   */
  angle2: number;

  /**
   * The first circle this vector is on.
   */
  circle1: Circle;

  /**
   * The second circle this vector is on.
   */
  circle2: Circle;

  /**
   * This vector unique index in the global vector set.
   */
  n: number;

  /**
   * This vector's absolute x position on the plane.
   */
  x: number;

  /**
   * This vector's absolute y position on the plane.
   */
  y: number;

  /**
   * Construct a vector.
   * @param param0 The (x, y) coordinates
   * @param circle1 The first circle
   * @param circle2 The second circle
   * @param n This vector's unique index in the vector set
   */
  constructor([x, y]: [number, number], circle1: Circle, circle2: Circle, n: number) {
    this.n = n;
    this.x = x;
    this.y = y;

    this.circle1 = circle1;
    this.circle2 = circle2;

    this.angle1 = atan2(x, y, circle1.x, circle1.y);
    this.angle2 = atan2(x, y, circle2.x, circle2.y);
  }

  /**
   * Retrieves this vector's angular position on a specific circle.
   * @param circle The circle of reference.
   * @returns The angle in radians, or undefined if the circle is unknown.
   */
  getAngle(circle: Circle): number | undefined {
    if (this.circle1 === circle) return this.angle1;
    if (this.circle2 === circle) return this.angle2;

    return undefined;
  }


  getConnections(): Arc[] {
    return [
      ...this.circle1.getConnections(this),
      ...this.circle2.getConnections(this),
    ];
  }

  /**
   * Given a circle, return the other circle this vector is a part of.
   * @param circle The reference circle (so you get the other one)
   * @returns a circle, or undefined if the reference circle is unknown
   */
  getOtherCircle(circle: Circle): Circle | undefined {
    if (this.circle1 === circle) {
      return this.circle2;
    }
    if (this.circle2 === circle) {
      return this.circle1;
    }
    return undefined;
  }
}
