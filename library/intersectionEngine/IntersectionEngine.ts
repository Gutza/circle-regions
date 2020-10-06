import Bitset from 'bitset';
import { IntersectionCircle } from '../Types';
import Arc from "./Arc";
import Circle from "./Circle";
import Region from './Region';
import Vector from "./Vector";
const floor = require('lodash.floor');

interface History {
    [key: string]: true;
}
  
interface Intersections {
    [key: number]: boolean;
}  

export class IntersectionEngine {
    precise = (n: number) => floor(n, 5);

    /**
     * Computes the intersection points between two circles. Returns an empty array if the circles don't intersect.
     * @param circle1 The first circle
     * @param circle2 The second circle
     */
    getCircleIntersections = (circle1: Circle, circle2: Circle):[[number, number], [number, number]] | [] => {
        const { x: x1, y: y1, radius: r1 } = circle1;
        const { x: x2, y: y2, radius: r2 } = circle2;

        const dSquared = (x2-x1)**2 + (y2-y1)**2;
        if (dSquared > (r1+r2)**2) {
            // The circles are outside one another
            return [];
        }

        if (dSquared < (r2-r1)**2) {
            // One of the circles contains the other
            let child, parent: Circle;
            if (r1 > r2) {
                parent = circle1;
                child = circle2;
            } else {
                parent = circle2;
                child = circle1;
            }
            parent.children.push(child);
            child.parents.push(parent);

            return [];
        }

        const d = Math.sqrt(dSquared);
        const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
        const h = Math.sqrt(r1 * r1 - a * a);
        const x = x1 + a * (x2 - x1) / d;
        const y = y1 + a * (y2 - y1) / d;
        const rx = -(y2 - y1) * (h / d);
        const ry = -(x2 - x1) * (h / d);
        const p1: [number, number] = [this.precise(x + rx), this.precise(y - ry)];
        const p2: [number, number] = [this.precise(x - rx), this.precise(y + ry)];

        return [p1, p2];
    };

    getVectors = (circles: Circle[]) => {
    const vectors: Vector[] = [];
    
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            const iCircle = circles[i];
            const jCircle = circles[j];
        
            this.getCircleIntersections(iCircle, jCircle).forEach((point) => {
                const vector = new Vector(point, iCircle, jCircle, vectors.length);
        
                iCircle.addVector(vector);
                jCircle.addVector(vector);
                vectors.push(vector);
            });
        }
    }
    
    return vectors;
    };

    mergeBitsets = (a: Arc, b: Arc): string => {
        try {
          return (a.bitset as Bitset).or(b.bitset as Bitset).toString();
        } catch(error) {
          console.warn("Error in toString() for bitsets a", a.bitset, "b", b.bitset);
          return (a.bitset as Bitset).toString();
        }
    }

    getRegions = (A: Vector, circles: Circle[], history: History, regions: Region[] = [], arcs: Arc[] = [], intersections: Intersections = {}) => {
        const BC = arcs[arcs.length - 1];
        const C = BC ? BC.end : A;
      
        C.getConnections().forEach(CD => {
          if (BC) {
            if (BC.circle === CD.circle) return; // don't continue along the same circle
            if (history[this.mergeBitsets(BC, CD)]) return; // don't return to a previously traversed arc
      
            // For a valid region, all arcs' centers must be consistently inside some of the circles, and consistently OUTSIDE the other circles.
            for (const [n, isInside] of Object.entries(intersections)) {
              if (CD.circle.n === +n) {
                continue;
              }
              if (isInside !== circles[+n].isPointWithinCircle(CD.mx, CD.my)) {
                return;
              }
            }
          }
      
          const nextArcs = [...arcs, CD];
      
          if (A === CD.end) {
            regions.push(new Region(nextArcs));
            nextArcs.forEach((arc, i) => {
              history[this.mergeBitsets(arc, nextArcs[i + 1] || nextArcs[0])] = true;
            });
          } else {
            const cCircle = C.getOtherCircle(CD.circle) as Circle; // TODO: Check if this cast is safe
            const dCircle = CD.end.getOtherCircle(CD.circle) as Circle; // TODO: Check if this cast is safe
              const nextIntersections: Intersections = {
              ...intersections,
              [cCircle.n]: cCircle.isPointWithinCircle(CD.mx, CD.my),
              [dCircle.n]: dCircle.isPointWithinCircle(CD.mx, CD.my),
            };
            this.getRegions(A, circles, history, regions, nextArcs, nextIntersections);
          }
        });
      
        return regions;
    }

    /**
     * Compute the regions resulted from intersecting any number of circles.
     * @param circleDefinitions The circles to intersect.
     */
    getIntersectionRegions = (circleDefinitions: IntersectionCircle[]) => {
        const history = {};
        const circles = circleDefinitions.map((shape, n) => new Circle(shape, n));
        const vectors = this.getVectors(circles);
        const regions: (Region | Circle)[] = [...circles];
      
        let n = vectors.length;
        circles.forEach(({ segments }) => {
          segments.forEach((segment) => {
            segment.n = n++;
          });
        });
      
        vectors.forEach(vector =>
          regions.push(...this.getRegions(vector, circles, history))
        );
      
        return {
          /**
           * This is the beef. This array contains the list of regions the plane is partitioned in.
           * The array contains the stand-alone circles, and the curved n-gons resulted from
           * intersecting the circles. The array is optimally sorted for drawing
           * (even with filled regions).
           */
          regions: regions
            .filter(region =>
              region instanceof Region ||
              (region instanceof Circle && region.isRegion)
            )
            .sort((a, b) => {
              let aContour = a instanceof Region && a.isContour;
              let bContour = b instanceof Region && b.isContour;
              if (aContour == bContour) {
                return a.area - b.area;
              }
      
              return aContour ? 1 : -1;
            }),
          /**
           * The circles you passed to the function, now with guaranteed IDs -- and with areas.
           */
          circles: circles,
      
          /**
           * The list of intersection points between the circles.
           */
          vectors: vectors,
        };
    }
}