const assert = require('assert');
import getIntersectionAreas from '../library/getIntersectionAreas/getIntersectionAreas';
import Circle from '../library/getIntersectionAreas/Circle';
import Region from '../library/getIntersectionAreas/Region';
import { IntersectionCircle } from '../library/Types';
import isPointWithinCircle from '../library/math/isPointWithinCircle';
import Vector from '../library/getIntersectionAreas/Vector';

describe('Simple tests (just counting, no geometry)', () => {
    let circInt0 = getIntersectionAreas([]);
    it('should be empty', () => {
        assert.equal(circInt0.areas.length, 0);
    })

    let circle1: IntersectionCircle = {
        x: 0,
        y: 0,
        radius: 1
    }
    let circInt1 = getIntersectionAreas([circle1]);
    it('should contain one area', () => {
        assert.equal(circInt1.areas.length, 1);
    });
    it('should only contain the circle', () => {
        assert.equal(circInt1.areas.filter(s => (s instanceof Circle)).length, 1);
    });

    let circle2: IntersectionCircle = {
        x: 0.5,
        y: 0,
        radius: 1
    }

    let circInt2 = getIntersectionAreas([circle1, circle2]);
    it('should contain five total areas', () => {
        assert.equal(circInt2.areas.length, 5);
    });
    it('should contain two circles', () => {
        assert.equal(circInt2.areas.filter(s => (s instanceof Circle)).length, 2);
    });
    it('should contain three areas', () => {
        assert.equal(circInt2.areas.filter(s => (s instanceof Region)).length, 3);
    });
    it('should contain no circle regions', () => {
        assert.equal(circInt2.areas.filter(s => (s instanceof Circle && s.isRegion)).length, 0);
    });
});
