import assert from 'assert';
import { BezierHelper } from '../src';
import { RegionEngine } from '../src/RegionEngine';

describe("Bezier helper", () => {
    it("Tangent circles should render correctly", () => {
        const engine = new RegionEngine();
        engine.add(-1, 0, 1);
        engine.add(+1, 0, 1);
        const regions = engine.computeRegions();
        regions.forEach(r => {
            const poly = BezierHelper.renderPolygonArc(
                r,
                v => v.vcoords,
                anchors => anchors
            );
            assert.equal(poly.length > 2, true, `Received only ${poly.length} vertices!`);
        });
    })
});