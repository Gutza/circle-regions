const assert = require('assert');
import { getIntersectionRegions } from '../library/intersectionEngine/getIntersectionRegions';
import Circle from '../library/intersectionEngine/Circle';
import Region from '../library/intersectionEngine/Region';
import { IntersectionCircle } from '../library/Types';

describe('Counting', () => {
    let circInt0 = getIntersectionRegions([]);
    it('Intersecting no circles should produce an empty result', () => {
        assert.equal(circInt0.regions.length, 0);
    })

    let circle1: IntersectionCircle = {
        x: 0,
        y: 0,
        radius: 1
    }
    let circInt1 = getIntersectionRegions([circle1]);
    it('Intersecting one circle should produce one region', () => {
        assert.equal(circInt1.regions.length, 1);
    });
    it('Intersecting one circle should produce one stand-alone circle', () => {
        assert.equal(circInt1.regions.filter(s => (s instanceof Circle)).length, 1);
    });

    let circle2: IntersectionCircle = {
        x: 0.5,
        y: 0,
        radius: 1
    }

    let circInt2 = getIntersectionRegions([circle1, circle2]);
    it('Intersecting two circles should produce four total regions', () => {
        assert.equal(circInt2.regions.length, 4);
    });
    it('Intersecting two circles should contain no stand-alone circles', () => {
        assert.equal(circInt2.regions.filter(s => (s instanceof Circle)).length, 0);
    });
    it('Intersecting two circles should contain four regions', () => {
        assert.equal(circInt2.regions.filter(s => (s instanceof Region)).length, 4);
    });
    it('Intersecting two circles should contain three non-contour regions', () => {
        assert.equal(circInt2.regions.filter(s => (s instanceof Region && !s.isContour)).length, 3);
    });

    it('Intersecting two circles should contain three non-contour regions', () => {
        assert.equal(circInt2.regions.filter(s => (s instanceof Region && !s.isContour)).length, 3);
    });
    it('Intersecting two circles should contain one exterior contour', () => {
        assert.equal(circInt2.regions.filter(s => (s instanceof Region && s.isContour && !s.isInteriorContour)).length, 1);
    });
});
