import assert from 'assert';
import { Circle, Point, RegionEngine } from '../src';
import { setRounding } from '../src/geometry/utils/numbers';
import { ERoundingSize } from '../src/Types';

const expCircle = (exp: number, cx: number, cy: number, r: number): Circle => {
    const expNum = Math.pow(10, exp);
    return new Circle(new Point(cx * expNum, cy * expNum), r * expNum);
}

describe("Testing default circles", () => {
    for (var exp = -5; exp <= 11; exp++)
    {
        setRounding(ERoundingSize.default);
        const engine = new RegionEngine();
        engine.addCircle(expCircle(exp, -Math.SQRT2, -Math.SQRT2, 2));
        engine.addCircle(expCircle(exp, +Math.SQRT2, +Math.SQRT2, 2));
        engine.addCircle(expCircle(exp, -Math.SQRT2, +Math.SQRT2, 2));
        engine.addCircle(expCircle(exp, +Math.SQRT2, -Math.SQRT2, 2));
        engine.regions;
        const nodeCount = engine.nodes.length;
        it ("Small rounding should work well across a wide gamut of scales", () => {
            assert.strictEqual(nodeCount, 5, "Rounding fails for exp=" + exp);
        });
    }
});
