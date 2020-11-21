import assert from 'assert';
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
    it("Basic region count and discrimination", () => {
        assert.strictEqual(engine.isStale, true, "Regions should be stale after adding circles");
        assert.strictEqual(14, engine.regions.length, "There should be 14 regions in total");
        assert.strictEqual(0, engine.regions.filter(region => region instanceof Circle).length, "There should be no circles");
        assert.strictEqual(1, engine.regions.filter(region => (region as ArcPolygon).regionType === ERegionType.outerContour).length, "There should be a single outer contour");
    });
});

describe("Canonical interior contour", () => {
    const engine = new RegionEngine();
    engine.addCircle(new Circle(new Point(+0.00, +3.28), 2, "top"));
    engine.addCircle(new Circle(new Point(-1.78, +0.00), 2, "bottom left"));
    engine.addCircle(new Circle(new Point(+1.78, +0.00), 2, "bottom right"));
    it("Basic inner/outer contour discrimination", () => {
        assert.strictEqual(engine.isStale, true, "Regions should be stale after adding circles");
        assert.strictEqual(8, engine.regions.length, "There should be 8 regions in total");
        assert.strictEqual(0, engine.regions.filter(region => region instanceof Circle).length, "There should be no circles");
        assert.strictEqual(1, engine.regions.filter(region => (region as ArcPolygon).regionType === ERegionType.outerContour).length, "There should be a single outer contour");
        assert.strictEqual(1, engine.regions.filter(region => (region as ArcPolygon).regionType === ERegionType.innerContour).length, "There should be a single inner contour");
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
    it("Static inner/outer contour discrimination", () => {
        assert.strictEqual(engine.isStale, true, "Regions should be stale after adding circles");
        assert.strictEqual(54, engine.regions.length, "There should be 54 regions in total"); // Yes, I actually counted them
        assert.strictEqual(0, engine.regions.filter(region => region instanceof Circle).length, "There should be no circles");
        assert.strictEqual(1, engine.regions.filter(region => (region as ArcPolygon).regionType === ERegionType.outerContour).length, "There should be a single outer contour");
        assert.strictEqual(1, engine.regions.filter(region => (region as ArcPolygon).regionType === ERegionType.innerContour).length, "There should be a single inner contour");
    });
})

describe("Basic circle parent-child consistency", () => {
    const engine = new RegionEngine();

    const child = new Circle(new Point(0, 0), 1);
    const parent = new Circle(new Point(0, 0), 100);
    engine.addCircle(child);
    engine.addCircle(parent);
    engine.regions;

    assert.strictEqual(child.parents.includes(parent), true);
    assert.strictEqual(child.parents.length, 1);

    assert.strictEqual(parent.children.includes(child), true);
    assert.strictEqual(parent.children.length, 1);

    parent.radius = 99;
    child.center.x = 20;
    engine.regions;

    assert.strictEqual(child.parents.includes(parent), true);
    assert.strictEqual(child.parents.length, 1);

    assert.strictEqual(parent.children.includes(child), true);
    assert.strictEqual(parent.children.length, 1);
})