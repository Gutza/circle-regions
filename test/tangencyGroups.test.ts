import assert = require('assert');
import Circle from '../src/geometry/Circle';
import CircleGraph from '../src/topology/CircleGraph';

const graph = new CircleGraph();
graph.addCircle(new Circle(graph, {x: -3, y: 0}, 3));
graph.addCircle(new Circle(graph, {x: 3, y: 0}, 3));

describe("Tangency groups for two circles A-B", () => {
    it("Two tangent circles A-B should contain a single tangent group", () => {
        let tanGroupCount = 0;
        graph.nodes.forEach(node => {
            node.tangencyGroups.forEach(() => tanGroupCount++);
        });
        assert.equal(tanGroupCount, 1);
    });

    let yinCount = 0;
    let yangCount = 0;
    dumpGroups("Two", graph);

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

graph.addCircle(new Circle(graph, {x: -4, y:0}, 4));

describe("Tangency groups for three circles AA-B", () => {
    let yinCount = 0;
    let yangCount = 0;
    graph.nodes.forEach(node => {
        node.tangencyGroups.forEach(tanGroup => {
            yinCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yin").length;
            yangCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yang").length;
        });
    });

    dumpGroups("Three", graph);

    it("Three tangent circles AA-B should contain a single tangent group", () => {
        let tanGroupCount = 0;
        graph.nodes.forEach(node => {
            node.tangencyGroups.forEach(() => tanGroupCount++);
        });
        assert.equal(tanGroupCount, 1);
    });

    it('Three tangent circles AA-B should contain tangent groups with a delta of one', () => {
        assert.equal(Math.abs(yinCount - yangCount), 1);
    });
});

graph.addCircle(new Circle(graph, {x: 4, y:0}, 4));

describe("Tangency groups for four circles AA-BB", () => {
    it("Four tangent circles AA-BB should contain a single tangent group", () => {
        let tanGroupCount = 0;
        graph.nodes.forEach(node => {
            node.tangencyGroups.forEach(() => tanGroupCount++);
        });
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

    dumpGroups("Four", graph);

    it('Four tangent circles AA-BB should contain tangent groups with two yin', () => {
        assert.equal(yinCount, 2);
    });

    it('Four tangent circles AA-BB should contain tangent groups with two yang', () => {
        assert.equal(yangCount, 2);
    });
});

function dumpGroups(label: string, graph: CircleGraph) {
    return;
    console.log("-- <"+label+"> --");
    graph.nodes.forEach(node => {
        console.log("» Node", node);
        node.tangencyGroups.forEach(tanGroup => {
            console.log("»» Tangency group", tanGroup);
            tanGroup.elements.forEach(tgElement => {
                console.log("»»» Tangency group element", tgElement);
            })
        })
    })
    console.log("-- </"+label+"> --");
}