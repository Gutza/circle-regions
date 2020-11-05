import { Circle, Point, RegionEngine } from "../src";
import assert = require('assert');

const engine = new RegionEngine();
const dump = [
//    [null,50,546,228],
//    [null,50,519,302],
//    [null,50,556,314],
    [null,50,510,258],
//    [null,50,592,259],
    [null,50,606,230],
//    [null,50,631,282],
    [null,50,660,236]
];
dump.forEach(circleData => {
    engine.addCircle(new Circle(new Point(circleData[2] as number, circleData[3] as number), circleData[1] as number, circleData[0]))
});

describe("Ad hoc region computation", () => {
    it("Should not throw", () => {
        assert.doesNotThrow(() => {
            engine.regions;
        }, "Should work");        
    })
});