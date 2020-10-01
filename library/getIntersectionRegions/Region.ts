import { v4 } from 'uuid';
const mean = require('lodash.mean');
import { Intersection } from '../Types';
import Arc from './Arc';

export default class Region {
  arcs: Arc[];
  id: string;
  isCircle: boolean;
  isRegion: boolean;
  x: number;
  y: number;
  _perimeter?: number;
  _area?: number;

  constructor(arcs: Arc[]) {
    this.arcs = arcs;
    this.id = v4();
    this.isCircle = false;
    this.isRegion = true; // All areas are regions
    this.x = mean(arcs.map(({ mx }) => mx));
    this.y = mean(arcs.map(({ my }) => my));
  }

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
