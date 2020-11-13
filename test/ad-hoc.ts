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
    // TODO: Why is this issue not actually reproducible, as shown by the native bug report mechanism?
    // TODO: Automatically test within the actual bug reporting mechanism whether the report is indeed reproducible (parseFloat(toString()) or similar)
    [[200000000000,0,200000000000],[0.000012246467991473532,200000000000,200000000000],[-200000000000,0.000024492935982947064,200000000000],[-0.000036739403974420595,-200000000000,200000000000]],
];

describe("Ad hoc region computation", () => {
    dumps.forEach((dump, dumpIndex) => {
        const engine = new RegionEngine();
        dump.forEach((circleData, index) => {
            engine.addCircle(new Circle(new Point(circleData[0] as number, circleData[1] as number), circleData[2] as number, "C"+(index+1)));
        });
        it("Ad hoc dump #" + dumpIndex + " should not throw errors", () => {
            assert.doesNotThrow(() => {
                engine.regions;
            });
        })
    });
});