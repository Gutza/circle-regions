import { ICircle, ICircleIntersection, IPoint, IRegion, TIntersectionType } from "../Types";
import atan2 from '../utils/atan2';
import CircleSegment from "./CircleSegment";

/**
 * The main circle class.
 */
export default class Circle implements IRegion {
    /**
     * The segment cache for this circle.
     */
    private _segments?: CircleSegment[];

    /**
     * This circle's "children" (i.e. other circles from the intersection set which are fully enclosed in this one).
     */
    private _children: Circle[];

    /**
     * This circle's "parents" (i.e. other circles from the intersection set which fully enclose this one).
     */
    private _parents: Circle[];

    /**
     * The intersection points between this circle and other circles in the intersection set.
     */
    private _intersectionPoints: ICircleIntersection[];

    /**
     * This circle's center coordinates.
     */
    private _center: IPoint;

    /**
     * The circle's radius.
     */
    private _radius: number;

    /**
     * Internal cache for the circle's area.
     */
    private _area?: number;

    /**
     * Instantiate a new circle entity.
     */
    constructor(center: IPoint, radius: number) {
        this._center = center;
        this._radius = radius;
        this._children = [];
        this._parents = [];
        this._intersectionPoints = [];
    }

    /**
     * Retrieve this circle's center coordinates.
     */
    get center(): IPoint {
        return this._center;
    }

    /**
     * Move this circle.
     */
    set center(center: IPoint) {
        this._center = center;
        this.clearGeometryCaches();
    }

    /**
     * This circle's radius.
     */
    get radius(): number {
        return this._radius;
    }

    /**
     * Change this circle's radius.
     */
    set radius(radius: number) {
        this._area = undefined;
        this._radius = radius;
        this.clearGeometryCaches();
    }

    /**
     * Clear this circle's caches related to any of its geometric features (center or radius).
     */
    private clearGeometryCaches = () => {
        const neighbors = [... new Set(this._intersectionPoints.map(ip => ip.otherCircle))]; // unique circles
        neighbors.forEach(c => c.clearIntersectionPoints(this));
        this._intersectionPoints = [];
        this._segments = undefined;
    }

    /**
     * Retrieve this circle's area.
     */
    get area(): number {
        if (this._area !== undefined) {
            return this._area;
        }

        return this._area = Math.PI * this.radius ** 2;
    }

    /**
     * Intersect this circle with another one, and calculate their relationship (parent/child) and their intersection points.
     * @param circle The circle to intersect with.
     */
    public intersect = (circle: Circle): void => {
        const that = circle;
        if (this === that) {
            console.warn("Don't intersect a circle with itself!");
            return;
        }

        const centerDist = Math.hypot(this.center.x - that.center.x, this.center.y - that.center.y);
        if (centerDist > this.radius + that.radius) {
            return;
        }

        if (this.radius > centerDist + that.radius) {
            this._children.push(that);
            that._parents.push(this);
            return;
        }

        if (that.radius > centerDist + this.radius) {
            this._parents.push(that);
            that._children.push(this);
            return;
        }

        const a = (this.radius**2 - that.radius**2 + centerDist**2) / (2 * centerDist);
        const h = Math.sqrt(this.radius**2 - a**2);
        const x = this.center.x + a * (that.center.x - this.center.x) / centerDist;
        const y = this.center.y + a * (that.center.y - this.center.y) / centerDist;

        if (this.radius == centerDist + that.radius) {
            const tangentPoint: IPoint = {
                x: x,
                y: y,
            };
            this.addIntersectionPoint(that, tangentPoint, "tangent");
            that.addIntersectionPoint(this, tangentPoint, "tangent");    
        }

        const hDistRatio = h / centerDist;
        const rx = -(that.center.y - this.center.y) * hDistRatio;
        const ry = -(that.center.x - this.center.x) * hDistRatio;

        const point1: IPoint = {
            x: x+rx,
            y: y-ry,
        };
        this.addIntersectionPoint(that, point1, "lens");
        that.addIntersectionPoint(this, point1, "lens");

        const point2: IPoint = {
            x: x-rx,
            y: y+ry,
        }
        this.addIntersectionPoint(that, point2, "lens");
        that.addIntersectionPoint(this, point2, "lens");
    }

    /**
     * Add an intersection point with another circle in the cache.
     * @param circle The other circle we're intersecting with.
     * @param position The x and y coordinates of the intersection point.
     */
    private addIntersectionPoint(circle: Circle, position: IPoint, intersectionType: TIntersectionType) {
        this._intersectionPoints.push({
            otherCircle: circle,
            thisAngle: atan2(position.x, position.y, this.center.x, this.center.y),
            intersection: {
                intersectionType: intersectionType,
                point: position,
            }
        });
    }

    /**
     * Remove the intersection points with another circle from the cache.
     * @param circle The other circle.
     */
    private clearIntersectionPoints(circle: ICircle) {
        this._intersectionPoints = this._intersectionPoints.filter(ip => ip.otherCircle !== circle);
    }

    public getSegments(): CircleSegment[] {
        if (this._segments !== undefined) {
            return this._segments;
        }

        this._intersectionPoints = this._intersectionPoints.sort((a, b) => a.thisAngle - b.thisAngle);
        const segments: CircleSegment[] = [];
        for (let i = 0; i<this._intersectionPoints.length; i++) {
            const currInt = this._intersectionPoints[i];
            if (currInt.intersection.intersectionType === "tangent") {
                segments.push(new CircleSegment(this, currInt, currInt));
                continue;
            }

            const nextInt = this._intersectionPoints[i] || this._intersectionPoints[0];
            segments.push(new CircleSegment(this, currInt, nextInt));
        }
        
        return this._segments = segments;
    }
}
