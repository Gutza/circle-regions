import Bitset from 'bitset';
import Circle from './Circle';
import Vector from './Vector';

const TWO_PI = 2 * Math.PI;

/**
 * Circle segments belong to circles. Arcs are detached.
 */
export default class CircleSegment {
  /**
   * This segment's unique index.
   */
  private _n?: number;

  /**
   * The bit set associated with this segment.
   */
  bitset?: Bitset;

  /**
   * This segment's start's angular position on the reference circle.
   */
  a1: number;

  /**
   * This segment's end's angular position on the reference circle.
   */
  a2: number;

  /**
   * This segment's middle's angular position on the reference circle.
   */
  a3: number;

  /**
   * The circle this arc belongs to (the reference circle)
   */
  circle: Circle;

  /**
   * This segment's start's vector (i.e. intersection with the other circle)
   */
  end: Vector;

  /**
   * This segment's middle's x coordinate
   */
  mx: number;

  /**
   * This segment's middle's y coordinate
   */
  my: number;

  /**
   * This segment's end's vector (i.e. intersection with the other circle)
   */
  start: Vector;

  /**
   * Construct a new circle segment, given the start and end vector, and the reference circle
   * @param vector1 This segment's start vector (i.e. intersection point with the other circle)
   * @param vector2 This segment's end vector (i.e. intersection point with the other circle)
   * @param circle The reference circle
   */
  constructor(vector1: Vector, vector2: Vector, circle: Circle) {
    this.start = vector1;
    this.end = vector2;
    this.circle = circle;

    this.a1 = this.start.getAngle(this.circle) as number;
    this.a2 = this.end.getAngle(this.circle) as number;

    if (this.a1 > this.a2) this.a1 -= TWO_PI;

    this.a3 = this.a1 + (0.5 * (this.a2 - this.a1));

    this.mx = this.circle.x + this.circle.radius * Math.cos(this.a3);
    this.my = this.circle.y + this.circle.radius * Math.sin(this.a3);
  }

  /**
   * (setter) Set this segment's unique index, and initialize its bit set
   */
  set n(n: number | undefined) {
    this._n = n;
    this.bitset = new Bitset();
    this.bitset.set(n);
  }

  /**
   * (getter) Retrieve this segment's unique index.
   */
  get n(): number | undefined {
    return this._n;
  }
}
