import assert = require('assert');
import { Circle } from '../src/geometry/Circle';
import { Point } from '../src/geometry/Point';
import { RegionEngine } from '../src/RegionEngine';

console.log("=== Two tangent circles ===");
const engine = new RegionEngine();
engine.addCircle(new Circle(new Point(-1, 0), 1, "leftSmall"));
engine.addCircle(new Circle(new Point(2, 0), 2, "rightSmall"));
console.log("=== Three tangent circles ===");
engine.addCircle(new Circle(new Point(-3, 0), 3, "leftLarge"));
console.log("=== Four tangent circles ===");
engine.addCircle(new Circle(new Point(4, 0), 4, "rightLarge"));
console.log("=== Four tangent circles + chaotic circle ===");
engine.addCircle(new Circle(new Point(0, 5), 5, "top"));
engine.regions;

// TEMPORARY DEBUGGING
console.log("=== Three tangent circles ===");
engine.addCircle(new Circle(new Point(-3, 0), 3, "leftLarge"));
engine.regions;

console.log("=== Four tangent circles ===");
engine.addCircle(new Circle(new Point(4, 0), 4, "rightLarge"));
engine.regions;

console.log("=== Four tangent circles + chaotic circle ===");
engine.addCircle(new Circle(new Point(0, 5), 5, "top"));
engine.regions;

describe("Tangency groups for two circles A-B", () => {
    dumpGroups("Two", engine);
    let tanGroupCount = 0;
    engine.nodes.forEach(node => {
        node.tangencyGroups.forEach(() => tanGroupCount++);
    });
    it("Two tangent circles A-B should contain a single tangency group", () => {
        assert.equal(tanGroupCount, 1);
    });

    let yinCount = 0;
    let yangCount = 0;

    engine.nodes.forEach(node => {
        node.tangencyGroups.forEach(tanGroup => {
            yinCount += tanGroup.filter(tgElement => tgElement.parity === "yin").length;
            yangCount += tanGroup.filter(tgElement => tgElement.parity === "yang").length;
        });
    });

    it('Two tangent circles A-B should contain one yin', () => {
        assert.equal(yinCount, 1);
    });
    it('Two tangent circles A-B should contain one yang', () => {
        assert.equal(yangCount, 1);
    });
});

console.log("=== Three tangent circles ===");
engine.addCircle(new Circle(new Point(-3, 0), 3, "leftLarge"));
engine.regions;

describe("Tangency groups for three circles AA-B", () => {
    dumpGroups("Three", engine);

    let yinCount = 0;
    let yangCount = 0;
    engine.nodes.forEach(node => {
        node.tangencyGroups.forEach(tanGroup => {
            yinCount += tanGroup.filter(tgElement => tgElement.parity === "yin").length;
            yangCount += tanGroup.filter(tgElement => tgElement.parity === "yang").length;
        });
    });

    let tanGroupCount = 0;
    engine.nodes.forEach(node => {
        node.tangencyGroups.forEach(() => tanGroupCount++);
    });

    it("Three tangent circles AA-B should contain a single tangency group", () => {
        assert.equal(tanGroupCount, 1);
    });

    it('Three tangent circles AA-B should contain tangency groups with a delta of one', () => {
        assert.equal(Math.abs(yinCount - yangCount), 1);
    });
});

console.log("=== Four tangent circles ===");
engine.addCircle(new Circle(new Point(4, 0), 4, "rightLarge"));
engine.regions;

describe("Tangency groups for four circles AA-BB", () => {
    dumpGroups("Four", engine);

    let tanGroupCount = 0;
    engine.nodes.forEach(node => {
        node.tangencyGroups.forEach(() => tanGroupCount++);
    });

    it("Four tangent circles AA-BB should contain a single tangency group", () => {
        assert.equal(tanGroupCount, 1);
    });
    
    let yinCount = 0;
    let yangCount = 0;
    engine.nodes.forEach(node => {
        node.tangencyGroups.forEach(tanGroup => {
            yinCount += tanGroup.filter(tgElement => tgElement.parity === "yin").length;
            yangCount += tanGroup.filter(tgElement => tgElement.parity === "yang").length;
        });
    });

    it('Four tangent circles AA-BB should contain tangency groups with two yin', () => {
        assert.equal(yinCount, 2);
    });

    it('Four tangent circles AA-BB should contain tangency groups with two yang', () => {
        assert.equal(yangCount, 2);
    });
});

console.log("=== Four tangent circles + chaotic circle ===");
engine.addCircle(new Circle(new Point(0, 5), 5, "top"));
engine.regions;

describe("Tangency groups for five circles AA-BB + C", () => {
    dumpGroups("Five", engine);

    let tanGroupCount = 0;
    engine.nodes.forEach(node => {
        node.tangencyGroups.forEach(() => tanGroupCount++);
    });

    it("Five tangent circles AA-BB + C should contain ten tangency groups", () => {
        assert.equal(tanGroupCount, 10);
    });  
});

function dumpGroups(label: string, graph: RegionEngine, tanGroupNote?: string) {
    return;
    console.log("-- <"+label+"> --");
    graph.nodes.forEach(node => {
        console.log("» Node [" + node.coordinates.x + "," + node.coordinates.y + "] tanGroups", node.tangencyGroups, tanGroupNote || "");
        node.tangencyGroups.forEach(tanGroup => {
            console.log("»» Tangency group elements", tanGroup);
            return;
            tanGroup.forEach(tgElement => {
                console.log("»»» Tangency group element", tgElement);
            })
        })
    })
    console.log("-- </"+label+"> --");
}