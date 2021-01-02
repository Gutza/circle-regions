import assert from 'assert';
import { Circle } from '../src/geometry/Circle';
import { Point } from '../src/geometry/Point';
import { RegionEngine } from '../src/RegionEngine';
import GraphNode from '../src/topology/GraphNode';
import { ERegionType, ETangencyParity } from '../src/Types';

{
    // For starters, make sure this doesn't throw
    const engine = new RegionEngine();
    engine.addCircle(new Circle(new Point(-1, 0), 1));
    engine.addCircle(new Circle(new Point(+2, 0), 2));
    engine.computeRegions();
    engine.addCircle(new Circle(new Point(+0, 0), 3));
    engine.computeRegions();
}

describe("Simple tangency", () => {
    const engine = new RegionEngine();
    engine.add(245,164,50);
    engine.add(305,244,50);
    it("Simple tangency should work properly", done => {
        const regions = engine.computeRegions();
        assert.equal(regions.filter(r => r.regionType == ERegionType.outerContour).length, 1);
        done();
    });
});

const engine = new RegionEngine();
engine.addCircle(new Circle(new Point(-1, 0), 1, "leftSmall"));
engine.addCircle(new Circle(new Point(2, 0), 2, "rightSmall"));

function getElementCountsByParity(node: GraphNode): {yin: number, yang: number} {
    const result = {
        yin: 0,
        yang: 0,
    }
    node.tangencyCollection.tangencyGroups.forEach(tg => {
        tg.elements.forEach(tge => {
            if (tge.parity === ETangencyParity.yin) {
                result.yin++;
                return;
            }
            if (tge.parity === ETangencyParity.yang) {
                result.yang++;
                return;
            }
        });
    });

    return result;
}

describe("Tangency groups for two circles A-B", () => {
    const stale = engine.isStale;
    it("Adding a circle should result in stale regions", () => {
        assert.strictEqual(stale, true, "Adding a circle should result in stale regions");
    });
    engine.computeRegions();

    let tanGroupCount = 0;
    engine.nodes.forEach(node => {
        node.tangencyCollection.tangencyGroups.forEach(() => tanGroupCount++);
    });
    it("Two tangent circles A-B should contain a single tangency group", () => {
        assert.equal(tanGroupCount, 1);
    });

    let yinCount = 0;
    let yangCount = 0;

    engine.nodes.forEach(node => {
        const { yin, yang } = getElementCountsByParity(node);
        yinCount += yin;
        yangCount += yang;
    });

    it('Two tangent circles A-B should contain one yin', () => {
        assert.equal(yinCount, 1);
    });
    it('Two tangent circles A-B should contain one yang', () => {
        assert.equal(yangCount, 1);
    });
});

const circle = new Circle(new Point(0, 0), 3, "leftLarge");
engine.addCircle(circle);
engine.computeRegions();
circle.center.x = -3;

describe("Tangency groups for three circles AA-B", () => {
    const stale = engine.isStale;
    it("Adding a circle should result in stale regions", () => {
        assert.strictEqual(stale, true, "Adding a circle should result in stale regions");
    });
    engine.computeRegions();

    let yinCount = 0;
    let yangCount = 0;
    engine.nodes.forEach(node => {
        const { yin, yang } = getElementCountsByParity(node);
        yinCount += yin;
        yangCount += yang;
    });

    let tanGroupCount = 0;
    engine.nodes.forEach(node => {
        tanGroupCount += node.tangencyCollection.tangencyGroups.length;
    });

    it("Three tangent circles AA-B should contain a single tangency group", () => {
        assert.equal(tanGroupCount, 1);
    });

    it('Three tangent circles AA-B should contain tangency groups with a delta of one', () => {
        assert.equal(Math.abs(yinCount - yangCount), 1);
    });
});

engine.addCircle(new Circle(new Point(4, 0), 4, "rightLarge"));

describe("Tangency groups for four circles AA-BB", () => {
    const stale = engine.isStale;
    it("Adding a circle should result in stale regions", () => {
        assert.strictEqual(stale, true, "Adding a circle should result in stale regions");
    });
    engine.computeRegions();

    let tanGroupCount = 0;
    engine.nodes.forEach(node => {
        tanGroupCount += node.tangencyCollection.tangencyGroups.length;
    });


    it("Four tangent circles AA-BB should contain a single tangency group", () => {
        assert.equal(tanGroupCount, 1);
    });
    
    let yinCount = 0;
    let yangCount = 0;
    engine.nodes.forEach(node => {
        const { yin, yang } = getElementCountsByParity(node);
        yinCount += yin;
        yangCount += yang;
    });

    it('Four tangent circles AA-BB should contain tangency groups with two yin', () => {
        assert.equal(yinCount, 2);
    });

    it('Four tangent circles AA-BB should contain tangency groups with two yang', () => {
        assert.equal(yangCount, 2);
    });
});

engine.addCircle(new Circle(new Point(0, 5), 5, "top"));

describe("Tangency groups for five circles AA-BB + C", () => {
    const stale = engine.isStale;
    it("Adding a circle should result in stale regions", () => {
        assert.strictEqual(stale, true, "Adding a circle should result in stale regions");
    });
    engine.computeRegions();

    let tanGroupCount = 0;
    engine.nodes.forEach(node => {
        tanGroupCount += node.tangencyCollection.tangencyGroups.length;
    });

    it("Five tangent circles AA-BB + C should contain ten tangency groups", () => {
        assert.equal(tanGroupCount, 10);
    });  
});
