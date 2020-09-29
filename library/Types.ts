export type TypeDirection = -1 | 1;
export type TypeMode = 'draw' | 'fill' | 'view';

export interface Data {
  circles: IntersectionCircle[];
  intersections: Intersection[];
  height?: number;
  width?: number;
}

export interface IntersectionCircle {
  id?: string;
  radius: number;
  x: number;
  y: number;
}

export interface Intersection {
  arcs: IntersectionArc[];
  id?: string;
  isCircle: boolean;
  isRegion: boolean;
  radius: number;
  underlay?: boolean;
  x: number;
  y: number;
}

export interface IntersectionArc {
  a1: number;
  a2: number;
  convex?: boolean;
  radius: number;
  x: number;
  y: number;
}
