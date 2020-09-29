import { v4 } from 'uuid';
const floor = require('lodash.floor');
import { Intersection, IntersectionCircle } from '../Types';
import getCircleArea from '../math/getCircleArea';
import isPointWithinCircle from '../math/isPointWithinCircle';
import Arc from './Arc';
import CircleSegment from './CircleSegment';
import Vector from './Vector';

const precise = (n: number) => floor(n, 5);

export default class Circle {
  arcs: Arc[];
  area: number;
  id: string;
  isCircle: boolean;
  n: number;
  radius: number;
  segments: CircleSegment[];
  vectors: Vector[];
  x: number;
  y: number;

  public get isRegion(): boolean {
    return this.arcs.length > 0;
  }

  constructor(circle: IntersectionCircle, n: number) {
    this.isCircle = true;

    this.arcs = [];
    this.vectors = [];
    this.segments = [];

    this.id = v4();
    this.n = n;
    this.x = precise(circle.x);
    this.y = precise(circle.y);
    this.radius = precise(circle.radius);
    this.area = getCircleArea(circle);
  }

  addVector(vector: Vector) {
    if (this.vectors.some(v => v === vector)) {
      return;
    }
    this.vectors.push(vector);
    this.vectors.sort((a, b) => a.getAngle(this) - b.getAngle(this));
    this.segments = this.vectors.map((vector, i) =>
      new CircleSegment(vector, this.vectors[i + 1] || this.vectors[0], this)
    );
  }

  getConnections(vector: Vector) {
    const i = this.segments.findIndex(({ start }) => start === vector);

    return [
      new Arc(this.segments[i ? i - 1 : this.segments.length - 1], -1),
      new Arc(this.segments[i], 1),
    ];
  }

  isPointWithinCircle(x: number, y: number) {
    return isPointWithinCircle(x, y, this.x, this.y, this.radius);
  }

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
