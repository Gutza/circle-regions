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
    describe(label + " size circle rounding", () => {
        for (var exp = minExp; exp <= maxExp; exp++)
        {
            const engine = new RegionEngine();
            engine.addCircle(expCircle(exp, -Math.SQRT2, -Math.SQRT2, 2));
            engine.addCircle(expCircle(exp, +Math.SQRT2, +Math.SQRT2, 2));
            engine.addCircle(expCircle(exp, -Math.SQRT2, +Math.SQRT2, 2));
            engine.addCircle(expCircle(exp, +Math.SQRT2, -Math.SQRT2, 2));
            engine.regions;
            const nodeCount = engine.nodes.length;
            const testExp = exp;
            it (label + " rounding should work at 10^" + testExp, () => {
                assert.strictEqual(nodeCount, 5, "Rounding fails for exp=" + testExp);
            });
        }
    });
}

roundingWorkbenchSimple("Default", ERoundingSize.default, -5, 11);
roundingWorkbenchSimple("Small", ERoundingSize.small, -8, 7);
roundingWorkbenchSimple("Large", ERoundingSize.large, -2, 14);

const roundingWorkbenchExtra = (label: string, roundingSize: ERoundingSize, minExp: number, maxExp: number): void => {
    const totalSteps = 17;
    const angleStep = Math.PI*2/totalSteps;
    const rad = 2;
    setRounding(roundingSize);
    describe(label + " size circle rounding", () => {
        for (var angle = 0; angle < 2 * Math.PI; angle += angleStep) {
            for (var exp = minExp; exp <= maxExp; exp++)
            {
                const engine = new RegionEngine();
                for (var regionAngle = 0; regionAngle < 2 * Math.PI; regionAngle += Math.PI/2)  {
                    engine.addCircle(expCircle(exp, rad * Math.cos(angle+regionAngle), rad * Math.sin(angle+regionAngle), rad));
                }
                engine.regions;
                const nodeCount = engine.nodes.length;
                const testExp = exp;
                it (label + " rounding should work at 10^" + testExp, () => {
                    assert.strictEqual(nodeCount, 5, "Rounding fails for exp=" + testExp);
                });
            }
        }
    });
}

roundingWorkbenchExtra("Default", ERoundingSize.default, -5, 11);
