const assert = require('assert');
import getIntersectionRegions from '../library/getIntersectionRegions/getIntersectionRegions';
import Circle from '../library/getIntersectionRegions/Circle';
import Region from '../library/getIntersectionRegions/Region';
import { IntersectionCircle } from '../library/Types';

describe('Simple tests (just counting, no geometry)', () => {
    let circInt0 = getIntersectionRegions([]);
    it('should be empty', () => {
        assert.equal(circInt0.regions.length, 0);
    })

    let circle1: IntersectionCircle = {
        x: 0,
        y: 0,
        radius: 1
    }
    let circInt1 = getIntersectionRegions([circle1]);
    it('should contain one region', () => {
        assert.equal(circInt1.regions.length, 1);
    });
    it('should only contain the circle', () => {
        assert.equal(circInt1.regions.filter(s => (s instanceof Circle)).length, 1);
    });

    let circle2: IntersectionCircle = {
        x: 0.5,
        y: 0,
        radius: 1
    }

    let circInt2 = getIntersectionRegions([circle1, circle2]);
    it('should contain five total regions', () => {
        assert.equal(circInt2.regions.length, 5);
    });
    it('should contain two circles', () => {
        assert.equal(circInt2.regions.filter(s => (s instanceof Circle)).length, 2);
    });
    it('should contain three areas', () => {
        assert.equal(circInt2.regions.filter(s => (s instanceof Region)).length, 3);
    });
    it('should contain no circle regions', () => {
        assert.equal(circInt2.regions.filter(s => (s instanceof Circle && s.isRegion)).length, 0);
    });
});
