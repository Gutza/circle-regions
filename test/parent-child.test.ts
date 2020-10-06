const assert = require('assert');
import { IntersectionEngine } from '../library/intersectionEngine/IntersectionEngine';
import { IntersectionCircle } from '../library/Types';

describe('Parent-child', () => {
    let parent: IntersectionCircle = {
        id: "Darth",
        x: 0,
        y: 0,
        radius: 2,
    }
    let child: IntersectionCircle = {
        id: "Luke",
        x: 0,
        y: 0,
        radius: 1,
    }
    let ie = new IntersectionEngine();
    let ints = ie.getIntersectionRegions([parent, child]);

    let darthCircles = ints.circles.filter(c=>c.id=="Darth");
    let lukeCircles = ints.circles.filter(c=>c.id=="Luke");

    it('Circle IDs must survive', () => {
        assert.equal(darthCircles.length, 1);
        assert.equal(lukeCircles.length, 1);
    })

    it('Parent-child relationships must exist', () => {
        assert.equal(darthCircles[0].children.length, 1);
        assert.equal(darthCircles[0].parents.length, 0);

        assert.equal(lukeCircles[0].children.length, 0);
        assert.equal(lukeCircles[0].parents.length, 1);
    })

    it('Obi-Wan never told you what happened to your father', () => {
        assert.equal(darthCircles[0].children[0].id, "Luke");
        assert.equal(lukeCircles[0].parents[0].id, "Darth");
    });
});