import { Circle, Point, RegionEngine } from "../src";
import assert = require('assert');

const engine = new RegionEngine();
const dump = [
    [510,258, 50],
    [606,230, 50],
    [660,236, 50]
];
dump.forEach(circleData => {
    engine.addCircle(new Circle(new Point(circleData[0] as number, circleData[1] as number), circleData[2] as number))
});

describe("Ad hoc region computation", () => {
    it("Should not throw", () => {
        assert.doesNotThrow(() => {
            engine.regions;
        }, "Should work");        
    })
});