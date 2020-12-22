import assert from 'assert';
import { Circle, Point, RegionEngine } from '../src';
import { setRounding } from '../src/geometry/utils/numbers';
import { ERoundingSize } from '../src/Types';

const expCircle = (exp: number, cx: number, cy: number, r: number): Circle => {
    const expNum = Math.pow(10, exp);
    return new Circle(new Point(cx * expNum, cy * expNum), r * expNum);
}

const roundingWorkbenchSimple = (label: string, roundingSize: ERoundingSize, minExp: number, maxExp: number): void => {
    setRounding(roundingSize);
    describe(label + " size circle rounding (cartesian)", () => {
        for (var exp = minExp; exp <= maxExp; exp++)
        {
            const engine = new RegionEngine();
            engine.addCircle(expCircle(exp, -Math.SQRT2, -Math.SQRT2, 2));
            engine.addCircle(expCircle(exp, +Math.SQRT2, +Math.SQRT2, 2));
            engine.addCircle(expCircle(exp, -Math.SQRT2, +Math.SQRT2, 2));
            engine.addCircle(expCircle(exp, +Math.SQRT2, -Math.SQRT2, 2));
            engine.computeRegions();
            const nodeCount = engine.nodes.length;
            const testExp = exp;
            it (label + " rounding should work at 10^" + testExp, () => {
                assert.strictEqual(nodeCount, 5, "Rounding fails for exp=" + testExp);
            });
        }
    });
}

roundingWorkbenchSimple("Small", ERoundingSize.small, -8, 7);
roundingWorkbenchSimple("Default", ERoundingSize.default, -5, 11);
roundingWorkbenchSimple("Large", ERoundingSize.large, -2, 14);

const roundingWorkbenchExtra = (label: string, roundingSize: ERoundingSize, minExp: number, maxExp: number): void => {
    const totalSteps = 5;
    const angleStep = Math.PI*2/totalSteps;
    const circleRadius = 2;
    describe(label + " size circle rounding (rotated)", () => {
        for (var exp = minExp; exp <= maxExp; exp++) {
            const testExp = exp;
            it (label + " rounding should work at 10^" + testExp, () => {
                for (var testAngle = 0; testAngle < 2 * Math.PI - angleStep/10; testAngle += angleStep) { // subtract angleStep/10 to ensure we don't actually test 2*PI
                    const engine = new RegionEngine();
                    setRounding(roundingSize);
                    for (var circleRelativeAngle = 0; circleRelativeAngle < 2 * Math.PI; circleRelativeAngle += Math.PI/2)  {
                        const circleFinalAngle = angleStep/2 + testAngle + circleRelativeAngle;
                        engine.addCircle(expCircle(testExp, circleRadius * Math.cos(circleFinalAngle), circleRadius * Math.sin(circleFinalAngle), circleRadius));
                    }
                    assert.doesNotThrow(() => {
                        engine.computeRegions();
                    }, "Rounding throws error for exp=" + testExp + "@" + Math.round(180 * testAngle / Math.PI) + "°");
                    const nodeCount = engine.nodes.length;
                    assert.strictEqual(nodeCount, 5, "Rounding doesn't compute for exp=" + testExp + "@" + Math.round(180 * testAngle / Math.PI) + "°");
                }
            });
        }
    });
}

roundingWorkbenchExtra("Small", ERoundingSize.small, -8, 6);
roundingWorkbenchExtra("Default", ERoundingSize.default, -5, 9);
roundingWorkbenchExtra("Large", ERoundingSize.large, -2, 13);
