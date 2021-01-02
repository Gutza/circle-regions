import { Circle, Point, RegionEngine } from "../src";
import assert from 'assert';

const adHocData = [
    {
        label: "Moving away",
        steps: [
            [[0,0,1,0],[1,0,1,1]],
            [[0,0,1,0],[3,0,1,1]]
        ],
    },
    {
        label: "Engulfing radius",
        steps: [
            [[0,0,1,0],[1,0,1,1]],
            [[0,0,1,0],[1,0,3,1]]
        ],
    },
]

function buildCircle(circleMeta: number[]): Circle {
    return new Circle(new Point(circleMeta[0], circleMeta[1]), circleMeta[2], circleMeta[3]);
}

describe("Ad hoc tests (dynamic)", () => {
    adHocData.forEach(adHocAtom => {
        const engine = new RegionEngine();
        const circles = new Map<number, Circle>();
        it(`Ad hoc atom «${adHocAtom.label}» should not throw errors`, () => {
            adHocAtom.steps.forEach(stepData => {
                stepData.forEach(stepCircle => {
                    const circleId = stepCircle[3];
                    if (!circles.has(circleId)) {
                        circles.set(circleId, buildCircle(stepCircle));
                        engine.addCircle(circles.get(circleId) as Circle);
                    } else {
                        const circle = circles.get(circleId) as Circle;
                        if (circle.center.x != stepCircle[0]) {
                            circle.center.x = stepCircle[0];
                        }
                        if (circle.center.y != stepCircle[1]) {
                            circle.center.y = stepCircle[1];
                        }
                        if (circle.radius != stepCircle[2]) {
                            circle.radius = stepCircle[2];
                        }
                    }
                });

                // TODO: Also delete circles

                assert.doesNotThrow(() => {
                    engine.computeRegions();
                });    
            });
        });
    });
});
