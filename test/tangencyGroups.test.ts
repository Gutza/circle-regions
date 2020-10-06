import assert = require('assert');
import Circle from '../src/geometry/Circle';
import CircleGraph from '../src/topology/CircleGraph';

const graph = new CircleGraph();
graph.addCircle(new Circle(graph, {x: -3, y: 0}, 3));
graph.addCircle(new Circle(graph, {x: 3, y: 0}, 3));

describe("Tangency groups for two circles", () => {
    let yinCount = 0;
    let yangCount = 0;
    dumpGroups("Two", graph);

    graph.nodes.forEach(node => {
        node.tangencyGroups.forEach(tanGroup => {
            yinCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yin").length;
            yangCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yang").length;
        });
    });

    it('Two tangent circles should contain one yin', () => {
        assert.equal(yinCount, 1);
    });
    it('Two tangent circles should contain one yang', () => {
        assert.equal(yangCount, 1);
    });

});

graph.addCircle(new Circle(graph, {x: -4, y:0}, 4));

describe("Tangency groups for three circles", () => {
    let yinCount = 0;
    let yangCount = 0;
    graph.nodes.forEach(node => {
        node.tangencyGroups.forEach(tanGroup => {
            yinCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yin").length;
            yangCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yang").length;
        });
    });

    dumpGroups("Three", graph);

    it('Three tangent circles should contain a different number of yin and yang', () => {
        assert.equal(Math.abs(yinCount - yangCount), 1);
    });
});

graph.addCircle(new Circle(graph, {x: 4, y:0}, 4));

describe("Tangency groups for four circles", () => {
    let yinCount = 0;
    let yangCount = 0;
    graph.nodes.forEach(node => {
        node.tangencyGroups.forEach(tanGroup => {
            yinCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yin").length;
            yangCount += tanGroup.elements.filter(tgElement => tgElement.parity === "yang").length;
        });
    });

    dumpGroups("Four", graph);

    it('Four tangent circles should contain equal numbers of yin and yang', () => {
        assert.equal(yinCount, 2);
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