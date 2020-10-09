import assert = require('assert');
import { Circle } from '../src/geometry/Circle';
import { Graph } from '../src/topology/Graph';

const graph = new Graph();
graph.addCircle(new Circle({x: -1, y: 0}, 1));
graph.addCircle(new Circle({x: 2, y: 0}, 2));

describe("Tangency groups for two circles A-B", () => {
    dumpGroups("Two", graph);
    let tanGroupCount = 0;
    graph.nodes.forEach(node => {
        node.tangencyGroups.forEach(() => tanGroupCount++);
    });
    it("Two tangent circles A-B should contain a single tangency group", () => {
        assert.equal(tanGroupCount, 1);
    });

    let yinCount = 0;
    let yangCount = 0;

    graph.nodes.forEach(node => {
        node.tangencyGroups.forEach(tanGroup => {
            yinCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yin").length;
            yangCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yang").length;
        });
    });

    it('Two tangent circles A-B should contain one yin', () => {
        assert.equal(yinCount, 1);
    });
    it('Two tangent circles A-B should contain one yang', () => {
        assert.equal(yangCount, 1);
    });
});

graph.addCircle(new Circle({x: -3, y:0}, 3));

describe("Tangency groups for three circles AA-B", () => {
    dumpGroups("Three", graph);

    let yinCount = 0;
    let yangCount = 0;
    graph.nodes.forEach(node => {
        node.tangencyGroups.forEach(tanGroup => {
            yinCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yin").length;
            yangCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yang").length;
        });
    });

    let tanGroupCount = 0;
    graph.nodes.forEach(node => {
        node.tangencyGroups.forEach(() => tanGroupCount++);
    });

    it("Three tangent circles AA-B should contain a single tangency group", () => {
        assert.equal(tanGroupCount, 1);
    });

    it('Three tangent circles AA-B should contain tangency groups with a delta of one', () => {
        assert.equal(Math.abs(yinCount - yangCount), 1);
    });
});

graph.addCircle(new Circle({x: 4, y:0}, 4));

describe("Tangency groups for four circles AA-BB", () => {
    dumpGroups("Four", graph);

    let tanGroupCount = 0;
    graph.nodes.forEach(node => {
        node.tangencyGroups.forEach(() => tanGroupCount++);
    });

    it("Four tangent circles AA-BB should contain a single tangency group", () => {
        assert.equal(tanGroupCount, 1);
    });
    
    let yinCount = 0;
    let yangCount = 0;
    graph.nodes.forEach(node => {
        node.tangencyGroups.forEach(tanGroup => {
            yinCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yin").length;
            yangCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yang").length;
        });
    });

    it('Four tangent circles AA-BB should contain tangency groups with two yin', () => {
        assert.equal(yinCount, 2);
    });

    it('Four tangent circles AA-BB should contain tangency groups with two yang', () => {
        assert.equal(yangCount, 2);
    });
});

graph.addCircle(new Circle({x: 0, y: 5}, 5));

describe("Tangency groups for five circles AA-BB + C", () => {
    dumpGroups("Five", graph);

    let tanGroupCount = 0;
    graph.nodes.forEach(node => {
        node.tangencyGroups.forEach(() => tanGroupCount++);
    });

    it("Five tangent circles AA-BB + C should contain ten tangency groups", () => {
        assert.equal(tanGroupCount, 10);
    });  
});

function dumpGroups(label: string, graph: Graph, tanGroupNote?: string) {
    return;
    console.log("-- <"+label+"> --");
    graph.nodes.forEach(node => {
        console.log("» Node [" + node.coordinates.x + "," + node.coordinates.y + "] tanGroups", node.tangencyGroups, tanGroupNote || "");
        node.tangencyGroups.forEach(tanGroup => {
            console.log("»» Tangency group elements", tanGroup.elements);
            return;
            tanGroup.elements.forEach(tgElement => {
                console.log("»»» Tangency group element", tgElement);
            })
        })
    })
    console.log("-- </"+label+"> --");
}