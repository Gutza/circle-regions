import { v4 } from 'uuid';
const mean = require('lodash.mean');
import { Intersection } from '../Types';
import Arc from './Arc';
import Circle from './Circle';

/**
 * A region is a region of the 2D plane surrounded by connecting @see Arc entities.
 */
export default class Region {
  /**
   * The arcs which surround this region.
   */
  arcs: Arc[];

  /**
   * This region's unique ID. Always automatically generated as a UUID.
   */
  id: string;

  /**
   * Regions are never circles. Only @see Circle entities are circles.
   */
  isCircle: boolean;

  /**
   * Regions are always regions (and Baba is you). @see Circle entities are sometimes regions, and other times not.
   */
  isRegion: boolean;

  /**
   * The arithmetic average of this region's arc's middle's x coordinates.
   */
  x: number;

  /**
   * The arithmetic average of this region's arc's middle's y coordinates.
   */
  y: number;

  /**
   * Internal cache for this region's perimeter.
   */
  _perimeter?: number;

  /**
   * Internal cache for this region's surface area.
   */
  _area?: number;

  /**
   * Internal cache which remembers if this is an interior contour
   */
  _isInteriorContour?: boolean;

  /**
   * Internal cache which remembers if this is a contour
   */
  _isContour?: boolean;

  /**
   * Construct a new region.
   * @param arcs The arcs which will surround this region. The code does NOT test in the arcs are connected.
   */
  constructor(arcs: Arc[]) {
    this.arcs = arcs;
    this.id = v4();
    this.isCircle = false;
    this.isRegion = true; // All areas are regions
    this.x = mean(arcs.map(({ mx }) => mx));
    this.y = mean(arcs.map(({ my }) => my));
  }

  /**
   * This region's surface area.
   */
  get area(): number {
    if (this._area !== undefined) {
      return this._area;
    }

    let areaPolygon = 0;
    let areaSegment = 0;

    for (let i = 0; i < this.arcs.length; i++) {
      const a = this.arcs[i];
      const b = this.arcs[i + 1] || this.arcs[0];

      areaSegment += a.area * (this.isInCircle(a.circle) ? 1 : -1);
      areaPolygon += a.start.x * b.start.y - a.start.y * b.start.x;
    }

    return this._area = Math.abs(areaPolygon / 2) + areaSegment;
  }

  /**
   * This region's perimeter.
   */
  get perimeter(): number {
    if (this._perimeter !== undefined) {
      return this._perimeter;
    }

    let perimeter = 0;
    this.arcs.forEach(a => {
      perimeter += a.arcLength;
    });
    
    return this._perimeter = perimeter;
  }

  /**
   * Checks if this region is fully enclosed by the reference circle.
   * @param circle The reference circle.
   */
  isInCircle(circle: Circle): boolean {
    return this.arcs.every(arc => (
      arc.circle === circle ||
      circle.isPointWithinCircle(arc.mx, arc.my)
    ));
  }

  /**
   * Is this a contour?
   * Contours are regions which are not contained in any of the
   * circles which define them. Intersecting two circles produces
   * four regions: the main parts of the two circles, the intersection
   * of the two circles, and the exterior contour of the two circles.
   */
  get isContour(): boolean {
    if (this._isContour !== undefined) {
      return this._isContour;
    }

    // This region is a contour if it's not contained in any of the circles which make it up
    return this._isContour = !this.arcs.some(arc => this.isInCircle(arc.circle));
  }

  /**
   * If this is a contour, is it on the interior or on the exterior?
   * True if it's an interior contour, false if it's an exterior contour,
   * undefined if it's not a contour at all.
   * Intersecting any number of circles always produces one exterior contour.
   * Intersecting two circles never produces an interior contour, but carefully
   * arranging three (or more) circles can produce contours in-between the circles.
   * These are the interior contours.
   */
  get isInteriorContour(): boolean | undefined {
    if (this._isInteriorContour !== undefined) {
      return this._isInteriorContour;
    }

    if (!this.isContour) {
      return undefined;
    }

    let midPerim = 0;
    let cenPerim = 0;
    for(let a = 0; a < this.arcs.length - 1; a++) {
      let arc1 = this.arcs[a];
      let arc2 = this.arcs[a+1];
      midPerim += Math.hypot(arc1.mx - arc2.mx, arc1.my - arc2.my);
      cenPerim += Math.hypot(arc1.x - arc2.x, arc1.y - arc2.y);
    }

    return this._isInteriorContour = midPerim < cenPerim;
  }

  /**
   * Converts this region to a generic @see Intersection entity.
   */
  toObject(): Intersection {
    return {
      arcs: this.arcs.map((arc) => arc.toObject()),
      id: this.id,
      isCircle: false,
      isRegion: true,
      radius: -1,
      x: this.x,
      y: this.y,
    };
  }
}
