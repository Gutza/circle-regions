import assert from 'assert';
import { Circle, ERegionType, Point, RegionEngine } from '../src';

describe("Adding, moving, and removing circles", () => {
    const engine = new RegionEngine();
    const cLeft = engine.add(-1, +0, 2, "left");
    const cRight = engine.add(+1, +0, 2, "right");
    it("Computing regions with two intersecting circles", done => {
        assert.strictEqual(engine.isStale, true, "Regions should be stale after adding circles");
        assert.strictEqual(engine.computeRegions().length, 4, "There should be 4 regions in total");
        assert.strictEqual(engine.computeRegions().filter(region => region.regionType === ERegionType.outerContour).length, 1, "There should be a single outer contour//1");
        assert.strictEqual(engine.computeRegions().filter(region => region.regionType === ERegionType.region).length, 3, "There should be exactly three regular regions");
        done();
    });
    it("Recomputing regions after moving one of the circles so they don't intersect", done => {
        cRight.center.x += 100;
        assert.strictEqual(engine.isStale, true, "Regions should be stale after moving circles");
        assert.strictEqual(engine.computeRegions().length, 4, "There should be 4 regions in total");
        assert.strictEqual(engine.computeRegions().filter(region => region.regionType === ERegionType.outerContour).length, 2, "There should two single outer contours");
        assert.strictEqual(engine.computeRegions().filter(region => region.regionType === ERegionType.region).length, 2, "There should be two regular regions");
        done();
    });
    it("Recomputing regions after moving the circle back to intersect the other one", done => {
        cRight.center.x -= 100;
        assert.strictEqual(engine.isStale, true, "Regions should be stale after moving circles back again");
        assert.strictEqual(engine.computeRegions().length, 4, "There should be 4 regions in total after restoring the original positions");
        assert.strictEqual(engine.computeRegions().filter(region => region.regionType === ERegionType.outerContour).length, 1, "There should be a single outer contour//2");
        assert.strictEqual(engine.computeRegions().filter(region => region.regionType === ERegionType.region).length, 3, "There should be exactly three regular regions");
        done();
    });
    let midCircle: Circle;
    it("Recomputing regions after adding a third intersecting circle", done => {
        midCircle = engine.add(0, 0, 1, "middle");
        assert.strictEqual(engine.isStale, true, "Regions should be stale after adding circles");
        assert.strictEqual(6, engine.computeRegions().length, "There should be 6 regions in total");
        assert.strictEqual(1, engine.computeRegions().filter(region => region.regionType === ERegionType.outerContour).length, "There should be a single outer contour");
        done();
    });
    it("Recomputing regions after removing the third circle", done => {
        engine.removeCircle(midCircle);
        assert.strictEqual(engine.isStale, true, "Regions should be stale after removing the third circle");
        assert.strictEqual(engine.computeRegions().length, 4, "There should be 4 regions in total after removing the third circle");
        assert.strictEqual(engine.computeRegions().filter(region => region.regionType === ERegionType.outerContour).length, 1, "There should be a single outer contour//2");
        assert.strictEqual(engine.computeRegions().filter(region => region.regionType === ERegionType.region).length, 3, "There should be exactly three regular regions");
        done();
    });
});


describe("Four overlapping axis-centered circles", () => {
    const engine = new RegionEngine();
    engine.addCircle(new Circle(new Point(-1, +0), 2, "left"));
    engine.addCircle(new Circle(new Point(+1, +0), 2, "right"));
    engine.addCircle(new Circle(new Point(+0, +1), 2, "top"));
    engine.addCircle(new Circle(new Point(+0, -1), 2, "bottom"));
    it("Basic region count and discrimination", () => {
        assert.strictEqual(engine.isStale, true, "Regions should be stale after adding circles");
        assert.strictEqual(14, engine.computeRegions().length, "There should be 14 regions in total");
        assert.strictEqual(1, engine.computeRegions().filter(region => region.regionType === ERegionType.outerContour).length, "There should be a single outer contour");
    });
});

describe("Canonical interior contour", () => {
    const engine = new RegionEngine();
    engine.addCircle(new Circle(new Point(+0.00, +3.28), 2, "top"));
    engine.addCircle(new Circle(new Point(-1.78, +0.00), 2, "bottom left"));
    engine.addCircle(new Circle(new Point(+1.78, +0.00), 2, "bottom right"));
    it("Basic inner/outer contour discrimination", () => {
        assert.strictEqual(engine.isStale, true, "Regions should be stale after adding circles");
        assert.strictEqual(8, engine.computeRegions().length, "There should be 8 regions in total");
        assert.strictEqual(1, engine.computeRegions().filter(region => region.regionType === ERegionType.outerContour).length, "There should be a single outer contour");
        assert.strictEqual(1, engine.computeRegions().filter(region => region.regionType === ERegionType.innerContour).length, "There should be a single inner contour");
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
        assert.strictEqual(54, engine.computeRegions().length, "There should be 54 regions in total"); // Yes, I actually counted them
        assert.strictEqual(1, engine.computeRegions().filter(region => region.regionType === ERegionType.outerContour).length, "There should be a single outer contour");
        assert.strictEqual(1, engine.computeRegions().filter(region => region.regionType === ERegionType.innerContour).length, "There should be a single inner contour");
    });
})

describe("Basic circle parent-child consistency", () => {
    const engine = new RegionEngine();

    const child = new Circle(new Point(0, 0), 1);
    const parent = new Circle(new Point(0, 0), 100);
    engine.addCircle(child);
    engine.addCircle(parent);
    engine.computeRegions();

    assert.strictEqual(child.parents.includes(parent), true);
    assert.strictEqual(child.parents.length, 1);

    assert.strictEqual(parent.children.includes(child), true);
    assert.strictEqual(parent.children.length, 1);

    parent.radius = 99;
    child.center.x = 20;
    engine.computeRegions();

    assert.strictEqual(child.parents.includes(parent), true);
    assert.strictEqual(child.parents.length, 1);

    assert.strictEqual(parent.children.includes(child), true);
    assert.strictEqual(parent.children.length, 1);
});

describe("Two-circle intersections must never produce inner regions", () => {
    const steps = 17;
    const centerRad = 1.5;
    it("Two-circle intersections must always contain exactly three regions and one outer contour", () => {
        for (var angle = 0; angle < 2 * Math.PI; angle += Math.PI/steps) {
            const degAngle = Math.round(angle * 180 / Math.PI);
            const engine = new RegionEngine;
            engine.addCircle(new Circle(new Point(0, 0), 1));
            const dynamicCircle = new Circle(new Point(Math.cos(angle) * centerRad, Math.sin(angle) * centerRad), 1);
            engine.addCircle(dynamicCircle);
            const regions = engine.computeRegions();
            assert.strictEqual(regions.filter(r => r.regionType === ERegionType.outerContour).length, 1, `There should be exactly one outer contours at ${degAngle}°`);
            assert.strictEqual(regions.filter(r => r.regionType === ERegionType.region).length, 3, `There should be exactly three regions at ${degAngle}°`);
            assert.strictEqual(regions.filter(r => r.regionType === ERegionType.innerContour).length, 0, `There should be no inner contours at ${degAngle}°`);
        }
    });
});