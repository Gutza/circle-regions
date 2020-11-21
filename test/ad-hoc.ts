import { Circle, Point, RegionEngine } from "../src";
import assert from 'assert';

const dumps = [
    [
        [510,258,50],
        [606,230,50],
        [570,170,50],
    ],
    [
        [371,123,50],
        [291,183,50],
        [341,181,50],
    ],
    [
        [-1, +0, 1],
        [+1, +0, 1],
        [-0, +1, 1],
    ],
    [
        [-Math.SQRT2, -Math.SQRT2, 2],
        [-Math.SQRT2, +Math.SQRT2, 2],
        [+Math.SQRT2, -Math.SQRT2, 2],
    ],
    [[510,258,50],[606,230,50],[570,170,50]],
];

describe("Ad hoc region computation", () => {
    dumps.forEach((dump, dumpIndex) => {
        const engine = new RegionEngine();
        dump.forEach((circleData, index) => {
            engine.addCircle(new Circle(new Point(circleData[0], circleData[1]), circleData[2], "C"+(index+1)));
        });
        it("Ad hoc dump #" + dumpIndex + " should not throw errors", () => {
            assert.doesNotThrow(() => {
                engine.regions;
            });
        });
    });
});
