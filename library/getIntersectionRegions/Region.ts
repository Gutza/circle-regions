import { v4 } from 'uuid';
const mean = require('lodash.mean');
import { Intersection } from '../Types';
import Arc from './Arc';

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

      areaSegment += a.area * ((a.isConvex(this) ? 1 : -1));
      areaPolygon += (a.start.x * b.start.y) - (a.start.y * b.start.x);
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
