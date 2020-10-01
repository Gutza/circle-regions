import { v4 } from 'uuid';
const floor = require('lodash.floor');
import { Intersection, IntersectionCircle } from '../Types';
import isPointWithinCircle from '../math/isPointWithinCircle';
import Arc from './Arc';
import CircleSegment from './CircleSegment';
import Vector from './Vector';
import { isUndefined } from 'util';

const precise = (n: number) => floor(n, 5);

/**
 * The main Circle class in circle-regions.
 */
export default class Circle {
  /**
   * The arcs between intersections with other circles.
   */
  arcs: Arc[];

  // No need to cache it; it's calculated in the constructor.
  /**
   * This circle's surface area. Use this to calculate the zIndex when drawing the circles.
   */
  area: number;

  /**
   * This circle's unique ID. If you provide an ID in the @see IntersectionCircle constructor, it will be preserved.
   * Otherwise, a unique ID will be generated for you.
   */
  id: string;

  /**
   * Always true for circles.
   */
  isCircle: boolean;

  /**
   * This circle's index in the global circles array. Used by the business logic.
   */
  n: number;

  /**
   * Yes, this is the circle's radius.
   */
  radius: number;

  /**
   * This circle's "segments" (i.e. the arcs between intersections with other circles).
   * @see CircleSegment for terminology.
   */
  segments: CircleSegment[];

  /**
   * This circle's vectors (i.e. the points of intersection with other circles)
   */
  vectors: Vector[];

  /**
   * The circle center's x coordinate.
   */
  x: number;

  /**
   * The circle center's y coordinate.
   */
  y: number;

  /**
   * An easy way to check if this circle is a stand-alone region (i.e. if it intersects no other circles)
   */
  public get isRegion(): boolean {
    return this.segments.length === 0;
  }

  /**
   * Construct a new circle. You generally don't want to call this yourself; use @see {getIntersectionRegions()} instead.
   * @param circle The circle parameters
   * @param n This circle's index in the global circle array
   */
  constructor(circle: IntersectionCircle, n: number) {
    this.isCircle = true;

    this.arcs = [];
    this.vectors = [];
    this.segments = [];

    if (isUndefined(circle.id)) {
      this.id = v4();
    } else {
      this.id = circle.id;
    }
    this.n = n;
    this.x = precise(circle.x);
    this.y = precise(circle.y);
    this.radius = precise(circle.radius);
    this.area = Math.PI * (circle.radius ** 2);
  }

  /**
   * Add a new vector (i.e. a new intersection point) on this circle.
   * Recalculates the entire @see Circle.segments array.
   * @param vector The new vector
   * @returns true if the vector was successfully added, false if it was already known
   */
  addVector(vector: Vector): boolean {
    if (this.vectors.some(v => v === vector)) {
      return false;
    }

    this.vectors.push(vector);
    this.vectors.sort((a, b) => (a.getAngle(this) as number) - (b.getAngle(this) as number));
    this.segments = this.vectors.map((vector, i) =>
      new CircleSegment(vector, this.vectors[i + 1] || this.vectors[0], this)
    );
    return true;
  }

  /**
   * Returns the given vector's connections on this circle (i.e. its two neighboring arcs)
   * @param vector The reference vector.
   */
  getConnections(vector: Vector): [Arc, Arc] {
    const i = this.segments.findIndex(({ start }) => start === vector);

    return [
      new Arc(this.segments[i ? i - 1 : this.segments.length - 1], -1),
      new Arc(this.segments[i], 1),
    ];
  }

  /**
   * Check if a point is located inside this circle.
   * @param x The x coordinate of the point to check.
   * @param y The y coordinate of the point to check.
   * @returns true if the point is inside the circle, or false otherwise.
   */
  isPointWithinCircle(x: number, y: number): boolean {
    return isPointWithinCircle(x, y, this.x, this.y, this.radius);
  }

  /**
   * Convert this circle to a generic @see Intersection object.
   */
  toObject(): Intersection {
    return {
      arcs: [],
      id: this.id,
      isCircle: true,
      isRegion: this.isRegion,
      radius: this.radius,
      underlay: this.segments.length > 0,
      x: this.x,
      y: this.y,
    };
  }
}
