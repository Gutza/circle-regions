import assert from 'assert';
import { Circle, Point, RegionEngine } from '../src';
import { setRounding } from '../src/geometry/utils/numbers';
import { ERoundingSize } from '../src/Types';

const expCircle = (exp: number, cx: number, cy: number, r: number): Circle => {
    const expNum = Math.pow(10, exp);
    return new Circle(new Point(cx * expNum, cy * expNum), r * expNum);
}

setRounding(ERoundingSize.default);
describe("Testing default circles", () => {
    for (var exp = -5; exp <= 11; exp++)
    {
        const engine = new RegionEngine();
        engine.addCircle(expCircle(exp, -Math.SQRT2, -Math.SQRT2, 2));
        engine.addCircle(expCircle(exp, +Math.SQRT2, +Math.SQRT2, 2));
        engine.addCircle(expCircle(exp, -Math.SQRT2, +Math.SQRT2, 2));
        engine.addCircle(expCircle(exp, +Math.SQRT2, -Math.SQRT2, 2));
        engine.regions;
        const nodeCount = engine.nodes.length;
        const testExp = exp;
        it ("Default rounding should work well across a wide gamut of scales", () => {
            assert.strictEqual(nodeCount, 5, "Rounding fails for exp=" + testExp);
        });
    }
});

setRounding(ERoundingSize.small);
describe("Testing small circles", () => {
    for (var exp = -8; exp <= 7; exp++)
    {
        const engine = new RegionEngine();
        engine.addCircle(expCircle(exp, -Math.SQRT2, -Math.SQRT2, 2));
        engine.addCircle(expCircle(exp, +Math.SQRT2, +Math.SQRT2, 2));
        engine.addCircle(expCircle(exp, -Math.SQRT2, +Math.SQRT2, 2));
        engine.addCircle(expCircle(exp, +Math.SQRT2, -Math.SQRT2, 2));
        engine.regions;
        const nodeCount = engine.nodes.length;
        const testExp = exp;
        it ("Small rounding should work well across a wide gamut of scales", () => {
            assert.strictEqual(nodeCount, 5, "Rounding fails for exp=" + testExp);
        });
    }
});

setRounding(ERoundingSize.large);
describe("Testing large circles", () => {
    for (var exp = -2; exp <= 14; exp++)
    {
        const engine = new RegionEngine();
        engine.addCircle(expCircle(exp, -Math.SQRT2, -Math.SQRT2, 2));
        engine.addCircle(expCircle(exp, +Math.SQRT2, +Math.SQRT2, 2));
        engine.addCircle(expCircle(exp, -Math.SQRT2, +Math.SQRT2, 2));
        engine.addCircle(expCircle(exp, +Math.SQRT2, -Math.SQRT2, 2));
        engine.regions;
        const nodeCount = engine.nodes.length;
        const testExp = exp;
        it ("Large rounding should work well across a wide gamut of scales", () => {
            assert.strictEqual(nodeCount, 5, "Rounding fails for exp=" + testExp);
        });
    }
});