import Bitset from 'bitset';
import { IntersectionArc, TypeDirection } from '../Types';
import Region from './Region';
import Circle from './Circle';
import CircleSegment from './CircleSegment';
import Vector from './Vector';

const TWO_PI = 2 * Math.PI;

/**
 * In circle-regions, an arc is one of the sides of a region.
 */
export default class Arc {
  /**
   * The cached geometric area.
   */
  _area?: number;

  /**
   * The reference segment's starting angular position on the reference circle.
   */
  a1: number;

  /**
   * The reference segment's ending angular position on the reference circle.
   */
  a2: number;

  /**
   * The internal bitset, used to traverse the network in order to extract the regions.
   */
  bitset?: Bitset;

  /**
   * The reference circle.
   */
  circle: Circle;

  /**
   * The arc's direction; indicates which direction to connect @see Arc.a1 to @see Arc.a2
   */
  direction: TypeDirection;

  /**
   * This arc's midpoint's x coordinate.
   */
  mx: number;

  /**
   * This arc's midpoint's y coordinate.
   */
  my: number;

  /**
   * The reference circle's radius.
   */
  radius: number;

  /**
   * The vector at the start of this arc.
   */
  start: Vector;

  /**
   * The vector at the end of this arc.
   */
  end: Vector;

  /**
   * The reference circle's center's x coordinate.
   */
  x: number;

  /**
   * The reference circle's center's y coordinate.
   */
  y: number;

  /**
   * Cached value for the arc length.
   */
  _arcLength?: number;

  /**
   * Construct an arc based on a CircleSegment
   * @param segment The reference circle segment
   * @param direction The direction of the segment
   */
  constructor(segment: CircleSegment, direction: TypeDirection) {
    this.direction = direction;

    this.bitset = segment.bitset;
    this.mx = segment.mx;
    this.my = segment.my;

    this.circle = segment.circle;
    this.radius = this.circle.radius;
    this.x = this.circle.x;
    this.y = this.circle.y;

    if (direction == 1) {
      this.start = segment.start;
      this.end = segment.end;
    } else {
      this.start = segment.end;
      this.end = segment.start;
    }

    this.a1 = this.start.getAngle(this.circle) as number;
    this.a2 = this.end.getAngle(this.circle) as number;

    if (this.direction === 1 && this.a1 > this.a2) {
      this.a1 -= TWO_PI;
    }
    else if (this.direction === -1 && this.a2 > this.a1) {
      this.a2 -= TWO_PI;
    }
  }

  /**
   * Retrieve the length of this arc. Once computed, the value is cached.
   */
  get arcLength(): number {
    if (this._arcLength !== undefined) {
      return this._arcLength;
    }

    const ø = Math.abs(this.a2 - this.a1);
    return this._arcLength = this.circle.radius * ø;
  }

  /**
   * Retrieve the geometric area of this arc. Once computed, the value is cached.
   */
  get area(): number {
    if (this._area !== undefined) {
      return this._area;
    }

    const ø = Math.abs(this.a2 - this.a1);
    return this._area = 0.5 * this.circle.radius ** 2 * (ø - Math.sin(ø));
  }

  /**
   * Convert this arc into a generic @see IntersectionArc
   */
  toObject(): IntersectionArc {
    return {
      a1: this.a1,
      a2: this.a2,
      radius: this.radius,
      x: this.x,
      y: this.y,
    };
  }
}
