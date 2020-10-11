import assert = require('assert');

import { Circle } from '../src/geometry/Circle';
import { Point } from '../src/geometry/Point';
import { Graph } from '../src/topology/Graph';

const graph = new Graph();
/*
graph.addCircle(new Circle({x: -1, y: +0}, 2, "negC"));
graph.addCircle(new Circle({x: +1, y: +0}, 2, "posC"));
graph.addCircle(new Circle({x: +0, y: +1}, 2, "topC"));
graph.addCircle(new Circle({x: +0, y: -1}, 2, "btmC"));
*/
graph.addCircle(new Circle(new Point(+0.00, +3.28), 2, "topC"));
graph.addCircle(new Circle(new Point(-1.78, +0.00), 2, "btlC"));
graph.addCircle(new Circle(new Point(+1.78, +0.00), 2, "btrC"));

try {
    graph.regions;
} catch(err) {
    console.warn("Error", err);
}

/*
import assert = require('assert');
import Circle from '../src/geometry/Circle';

describe('Basic circle functionalities', () => {
    let circle1 = new Circle({x: -3, y: 0}, 5);
    let circle2 = new Circle({x: 3, y: 0}, 5);

    circle1.intersect(circle2);
    let segments1 = circle1.getSegments();
    let segments2 = circle2.getSegments();
    it('Pythagorean intersection should work', () => {
        assert.equal(segments1.length, 2);
        assert.equal(segments2.length, 2);
    });

    const [ circ1seg1, circ1seg2 ] = segments1;
    const [ circ2seg1, circ2seg2 ] = segments2;

    it('Pythagorean segments should match angle order', () => {
        assert.equal(circ1seg1.intersection1.thisAngle < circ1seg1.intersection2.thisAngle, true);
        assert.equal(circ1seg2.intersection1.thisAngle, circ1seg1.intersection2.thisAngle);
        assert.equal(circ1seg2.intersection2.thisAngle, circ1seg1.intersection1.thisAngle);

        assert.equal(circ2seg1.intersection1.thisAngle < circ2seg1.intersection2.thisAngle, true);
        assert.equal(circ2seg2.intersection2.thisAngle, circ2seg1.intersection1.thisAngle);
        assert.equal(circ2seg2.intersection1.thisAngle, circ2seg1.intersection2.thisAngle);
    });

    it('Pythagorean intersection points should match Pythagoras', () => {
        assert.equal(circ1seg1.intersection1.intersection.point.x, 0);
        assert.equal(circ1seg1.intersection1.intersection.point.y, 4);
        assert.equal(circ1seg1.intersection2.intersection.point.x, 0);
        assert.equal(circ1seg1.intersection2.intersection.point.y, -4);

        assert.equal(circ1seg2.intersection1.intersection.point.x, 0);
        assert.equal(circ1seg2.intersection1.intersection.point.y, -4);
        assert.equal(circ1seg2.intersection2.intersection.point.x, 0);
        assert.equal(circ1seg2.intersection2.intersection.point.y, 4);

        assert.equal(circ2seg1.intersection1.intersection.point.x, 0);
        assert.equal(circ2seg1.intersection1.intersection.point.y, 4);
        assert.equal(circ2seg1.intersection2.intersection.point.x, 0);
        assert.equal(circ2seg1.intersection2.intersection.point.y, -4);

        assert.equal(circ2seg2.intersection1.intersection.point.x, 0);
        assert.equal(circ2seg2.intersection1.intersection.point.y, -4);
        assert.equal(circ2seg2.intersection2.intersection.point.x, 0);
        assert.equal(circ2seg2.intersection2.intersection.point.y, 4);
    });
})
*/