import { IPoint, IRegion } from "../Types";
import CircleGraph from "../topology/CircleGraph";

/**
 * The main circle class.
 */
export default class Circle implements IRegion {
    private _graph: CircleGraph;

    /**
     * This circle's "children" (i.e. other circles from the intersection set which are fully enclosed in this one).
     */
    private _children: Circle[];

    /**
     * This circle's "parents" (i.e. other circles from the intersection set which fully enclose this one).
     */
    private _parents: Circle[];

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
    constructor(graph: CircleGraph, center: IPoint, radius: number) {
        this._graph = graph;
        this._center = center;
        this._radius = radius;
        this._children = [];
        this._parents = [];
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
        this._graph.removeCircle(this);
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

    public addChild = (circle: Circle): void => {
        this._children.push(circle);
    }

    public addParent = (circle: Circle): void => {
        this._parents.push(circle);
    }
}
