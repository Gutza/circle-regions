import Bitset from 'bitset';
import Arc from './Arc';
import { IntersectionCircle } from '../Types';
import Region from './Region';
import Circle from './Circle';
import Vector from './Vector';
import getIntersectionCirclePoints from './getIntersectionCirclePoints';

interface History {
  [key: string]: true;
}

interface Intersections {
  [key: number]: boolean;
}

const getVectors = (circles: Circle[]) => {
  const vectors: Vector[] = [];

  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      const iCircle = circles[i];
      const jCircle = circles[j];

      getIntersectionCirclePoints(iCircle, jCircle).forEach((point) => {
        const vector = new Vector(point, iCircle, jCircle, vectors.length);

        iCircle.addVector(vector);
        jCircle.addVector(vector);
        vectors.push(vector);
      });
    }
  }

  return vectors;
};

const mergeBitsets = (a: Arc, b: Arc) => (a.bitset as Bitset).or(b.bitset as Bitset).toString();

const getRegions = (A: Vector, circles: Circle[], history: History, regions: Region[] = [], arcs: Arc[] = [], intersections: Intersections = {}) => {
  const BC = arcs[arcs.length - 1];
  const C = BC ? BC.end : A;

  C.getConnections().forEach(CD => {
    if (BC) {
      if (BC.circle === CD.circle) return; // don't continue along the same circle
      if (history[mergeBitsets(BC, CD)]) return; // don't return to a previously traversed arc

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
        history[mergeBitsets(arc, nextArcs[i + 1] || nextArcs[0])] = true;
      });
    } else {
      const cCircle = C.getOtherCircle(CD.circle) as Circle; // TODO: Check if this cast is safe
      const dCircle = CD.end.getOtherCircle(CD.circle) as Circle; // TODO: Check if this cast is safe
        const nextIntersections: Intersections = {
        ...intersections,
        [cCircle.n]: cCircle.isPointWithinCircle(CD.mx, CD.my),
        [dCircle.n]: dCircle.isPointWithinCircle(CD.mx, CD.my),
      };
      getRegions(A, circles, history, regions, nextArcs, nextIntersections);
    }
  });

  return regions;
};

/**
 * Compute the regions resulted from intersecting any number of circles.
 * @param circleDefinitions The circles to intersect.
 */
export const getIntersectionRegions = (circleDefinitions: IntersectionCircle[]) => {
  const history = {};
  const circles = circleDefinitions.map((shape, n) => new Circle(shape, n));
  const vectors = getVectors(circles);
  const regions: (Region | Circle)[] = [...circles];

  let n = vectors.length;
  circles.forEach(({ segments }) => {
    segments.forEach((segment) => {
      segment.n = n++;
    });
  });

  vectors.forEach(vector =>
    regions.push(...getRegions(vector, circles, history))
  );

  return {
    /**
     * This is the beef. This array contains the list of regions the plane is partitioned in.
     * The array contains the stand-alone circles, and the curved n-gons resulted from
     * intersecting the circles.
     */
    regions: regions
      .filter(region =>
        (region instanceof Circle && region.isRegion) ||
        region.area > 0
      )
      .sort((a, b) => b.area - a.area),
    /**
     * The circles you passed to the function, now with guaranteed IDs -- and with areas.
     */
    circles: circles,

    /**
     * The list of intersection points between the circles.
     */
    vectors: vectors,
  };
};

module.exports.getIntersectionRegions = getIntersectionRegions;