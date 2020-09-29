import Bitset from 'bitset';
import { IntersectionArc } from '../Types';
import Circle from './Circle';
import CircleSegment from './CircleSegment';
import Vector from './Vector';
const TWO_PI = 2 * Math.PI;

export default class Arc {
  _area?: number;
  a1: number;
  a2: number;
  bitset?: Bitset;
  circle: Circle;
  direction: -1 | 1;
  mx: number;
  my: number;
  radius: number;
  start: Vector;
  end: Vector;
  x: number;
  y: number;
  _arcLength?: number;

  constructor(segment: CircleSegment, direction: -1 | 1) {
    this.direction = direction;

    this.bitset = segment.bitset;
    this.mx = segment.mx;
    this.my = segment.my;

    this.circle = segment.circle;
    this.radius = segment.circle.radius;
    this.x = segment.circle.x;
    this.y = segment.circle.y;

    this.start = direction === 1 ? segment.start : segment.end;
    this.end = direction === 1 ? segment.end : segment.start;

    this.a1 = this.start.getAngle(this.circle);
    this.a2 = this.end.getAngle(this.circle);

    if (this.direction === 1 && this.a1 > this.a2) this.a1 -= TWO_PI;
    if (this.direction === -1 && this.a2 > this.a1) this.a2 -= TWO_PI;
  }

  get arcLength(): number {
    if (this._arcLength !== undefined) {
      return this._arcLength;
    }

    const ø = Math.abs(this.a2 - this.a1);
    return this._arcLength = this.circle.radius * ø;
  }

  get area(): number {
    if (this._area !== undefined) {
      return this._area;
    }

    const ø = Math.abs(this.a2 - this.a1);
    const R = this.circle.radius;
    const s = this._arcLength = R * ø;
    const r = R * Math.cos(0.5 * ø);
    const a = 2 * Math.sqrt((R ** 2) - (r ** 2));

    return this._area = 0.5 * ((R * s) - (a * r));
  }

  isConvex(arcs: Arc[]) {
    return arcs.every((arc) => arc.circle === this.circle ||
      this.circle.isPointWithinCircle(arc.mx, arc.my));
  }

  toObject(): IntersectionArc {
    return {
      a1: this.a1,
      a2: this.a2,
      radius: this.circle.radius,
      x: this.circle.x,
      y: this.circle.y,
    };
  }
}
