import { Circle, Point, RegionEngine } from "../src";
import assert = require('assert');

const engine = new RegionEngine();
const dump1 = [
    [510,258,50],
    [606,230,50],
    [570,170,50]
];
const dump2 = [
    [371,123,50],
    [291,183,50],
    [341,181,50]
];
dump2.forEach((circleData, index) => {
    engine.addCircle(new Circle(new Point(circleData[0] as number, circleData[1] as number), circleData[2] as number, "C"+(index+1)));
});

describe("Ad hoc region computation", () => {
    it("Should not throw", () => {
        assert.doesNotThrow(() => {
            engine.regions;
        }, "Should work");        
    })
});