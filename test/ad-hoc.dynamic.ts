import { Circle, Point, RegionEngine } from "../src";
import assert from 'assert';

/*
const adHocData = [
    {
        label: "Dynamic 1",
        steps: [
            [{"x":317,"y":185,"r":53,"iId":0},{"x":379,"y":201,"r":53,"iId":1},{"x":401,"y":211,"r":77,"iId":2}],
            [{"x":317,"y":185,"r":53,"iId":0},{"x":379,"y":201,"r":53,"iId":1},{"x":399,"y":211,"r":77,"iId":2}]
        ]
    },
]

describe("Ad hoc tests (dynamic)", () => {
    adHocData.forEach(adHocAtom => {
        const engine = new RegionEngine();
        adHocAtom.circles.forEach((circleData, index) => {
            engine.add(circleData[0], circleData[1], circleData[2], "C" + (index + 1));
        });
        it(`Ad hoc atom «${adHocAtom.label}» should not throw errors`, () => {
            assert.doesNotThrow(() => {
                engine.computeRegions();
            });
        });
    });
});
*/