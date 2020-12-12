import { Circle, Point, RegionEngine } from "../src";
import assert from 'assert';

const adHocData = [
    { label: "Three silly circles", circles: [[515,375,50],[604,342,50],[499,291,50]] },
    { label: "Three circles around the origin", circles: [[-3,0,3],[4,0,4],[0,5,5]] },
    { label: "More silly circles", circles: [[508,306,50],[525,247,50],[431,301,50]] },
    { label: "Inner/outer contour canonical", circles: [[-3, 4, 5],[3,-4,5],[-6,0,1]] },
    { label: "Two intersecting circles, plus a tangent friend", circles: [[510,258,50],[606,230,50],[570,170,50]] },
    { label: "Tangency in circle", circles: [[371,123,50],[291,183,50],[341,181,50]] },
    {
        label: "Rounding test",
        circles: [
            [-Math.SQRT2, -Math.SQRT2, 2],
            [-Math.SQRT2, +Math.SQRT2, 2],
            [+Math.SQRT2, -Math.SQRT2, 2],
        ]
    },
    { label: "Inner/outer contour organic", circles: [[510,258,50],[606,230,50],[512,181,50]] },
    { label: "Inner/outer contour simplified (easier)", circles: [[-3, 0, 3],[4,0,4],[-3,-3,1]] },
    { label: "Inner/outer contour (only two circles)", circles: [[-3, 4, 5],[3,-4,5]] },
    { label: "Inner/outer contour exaggerated", circles: [[-3, 4, 5],[3,-4,5],[-6,0,8]] },
];

describe("Ad hoc region computation", () => {
    adHocData.forEach((adHocAtom, dumpIndex) => {
        const engine = new RegionEngine();
        adHocAtom.circles.forEach((circleData, index) => {
            engine.addCircle(new Circle(new Point(circleData[0], circleData[1]), circleData[2], "C" + (index + 1)));
        });
        it(`Ad hoc atom «${adHocAtom.label}» should not throw errors`, () => {
            assert.doesNotThrow(() => {
                engine.regions;
            });
        });
    });
});
