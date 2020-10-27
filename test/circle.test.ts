import assert = require('assert');
import { ArcPolygon } from '../src/geometry/ArcPolygon';

import { Circle } from '../src/geometry/Circle';
import { Point } from '../src/geometry/Point';
import { RegionEngine } from '../src/RegionEngine';
import { ERegionType } from '../src/Types';

describe("Four overlapping axis-centered circles", () => {
    const engine = new RegionEngine();
    engine.addCircle(new Circle(new Point(-1, +0), 2, "left"));
    engine.addCircle(new Circle(new Point(+1, +0), 2, "right"));
    engine.addCircle(new Circle(new Point(+0, +1), 2, "top"));
    engine.addCircle(new Circle(new Point(+0, -1), 2, "bottom"));
    assert.strictEqual(engine.regions.stale, false, "Regions should not be stale");
    it("Basic region count and discrimination", () => {
        assert.strictEqual(14, engine.regions.regions.length, "There should be 14 regions in total");
        assert.strictEqual(0, engine.regions.regions.filter(region => region instanceof Circle).length, "There should be no circles");
        assert.strictEqual(1, engine.regions.regions.filter(region => (region as ArcPolygon).regionType === ERegionType.outerContour).length, "There should be a single outer contour");
    });
});

describe("Canonical interior contour", () => {
    const engine = new RegionEngine();
    engine.addCircle(new Circle(new Point(+0.00, +3.28), 2, "top"));
    engine.addCircle(new Circle(new Point(-1.78, +0.00), 2, "bottom left"));
    engine.addCircle(new Circle(new Point(+1.78, +0.00), 2, "bottom right"));
    assert.strictEqual(engine.regions.stale, false, "Regions should not be stale");
    it("Basic inner/outer contour discrimination", () => {
        assert.strictEqual(8, engine.regions.regions.length, "There should be 8 regions in total");
        assert.strictEqual(0, engine.regions.regions.filter(region => region instanceof Circle).length, "There should be no circles");
        assert.strictEqual(1, engine.regions.regions.filter(region => (region as ArcPolygon).regionType === ERegionType.outerContour).length, "There should be a single outer contour");
        assert.strictEqual(1, engine.regions.regions.filter(region => (region as ArcPolygon).regionType === ERegionType.innerContour).length, "There should be a single inner contour");
    });
});

describe("Crazy interior contour", () => {
    const engine = new RegionEngine();
    engine.addCircle(new Circle(new Point(432, 84), 50));
    engine.addCircle(new Circle(new Point(354, 117), 50)); 
    engine.addCircle(new Circle(new Point(297, 191), 50)); 
    engine.addCircle(new Circle(new Point(260, 256), 50)); 
    engine.addCircle(new Circle(new Point(253, 344), 50)); 
    engine.addCircle(new Circle(new Point(251, 435), 50)); 
    engine.addCircle(new Circle(new Point(272, 529), 50)); 
    engine.addCircle(new Circle(new Point(348, 601), 50)); 
    engine.addCircle(new Circle(new Point(280, 591), 50)); 
    engine.addCircle(new Circle(new Point(432, 623), 50)); 
    engine.addCircle(new Circle(new Point(512, 636), 50)); 
    engine.addCircle(new Circle(new Point(588, 635), 50)); 
    engine.addCircle(new Circle(new Point(642, 551), 50)); 
    engine.addCircle(new Circle(new Point(661, 454), 50)); 
    engine.addCircle(new Circle(new Point(662, 365), 50)); 
    engine.addCircle(new Circle(new Point(655, 277), 50)); 
    engine.addCircle(new Circle(new Point(620, 197), 50)); 
    engine.addCircle(new Circle(new Point(567, 137), 50)); 
    engine.addCircle(new Circle(new Point(502, 104), 50)); 
    engine.addCircle(new Circle(new Point(337, 347), 50));
    engine.addCircle(new Circle(new Point(571, 364), 50));
    engine.addCircle(new Circle(new Point(432, 532), 50));
    engine.addCircle(new Circle(new Point(441, 435), 50));
    engine.addCircle(new Circle(new Point(373, 232), 50));
    engine.addCircle(new Circle(new Point(510, 212), 50));
    engine.addCircle(new Circle(new Point(568, 503), 50));
    assert.strictEqual(engine.regions.stale, false, "Regions should not be stale");
    it("Static inner/outer contour discrimination", () => {
        assert.strictEqual(54, engine.regions.regions.length, "There should be 54 regions in total"); // Yes, I actually counted them
        assert.strictEqual(0, engine.regions.regions.filter(region => region instanceof Circle).length, "There should be no circles");
        assert.strictEqual(1, engine.regions.regions.filter(region => (region as ArcPolygon).regionType === ERegionType.outerContour).length, "There should be a single outer contour");
        assert.strictEqual(1, engine.regions.regions.filter(region => (region as ArcPolygon).regionType === ERegionType.innerContour).length, "There should be a single inner contour");
    });
})



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