import { EGeometryEventType, IBoundingBox, IDrawable, IRegion } from "../Types";
import CircleVertex from "./CircleVertex";
import GraphNode from "../topology/GraphNode";
import { round } from "./utils/numbers";
import { Point } from "./Point";
import { PureGeometry } from "./PureGeometry";

/**
 * The main circle class. You can instantiate new circles either by calling
 * this ctor, and then adding the circles to regions via @see RegionEngine.addCircle(),
 * or you can just call helper method @see RegionEngine.add(), and retrieve the resulting
 * @see Circle entity from there.
 */
export class Circle extends PureGeometry implements IRegion, IDrawable {
    private static internalCounter: number = 0;
    protected _vertices: CircleVertex[] = [];
    private _sortedVertices: boolean = true;
    private _roundedBbox?: IBoundingBox;
    private _roundedRadius?: number;

    /**
     * Boolean indicating whether this circle should ever be displayed as such (or whether it's split into arcs which make up region boundaries).
     */
    public isDisplayed = false;

    public id: any;
    private _internalId: number;

    /**
     * This circle's "children" (i.e. other circles from the intersection set which are fully enclosed in this one).
     */
    public children: Circle[] = [];

    /**
     * This circle's "parents" (i.e. other circles from the intersection set which fully enclose this one).
     */
    public parents: Circle[] = [];

    /**
     * This circle's center coordinates.
     */
    private _center: Point;

    /**
     * The circle's radius.
     */
    private _radius: number;

    /**
     * Internal cache for the circle's area.
     */
    private _area?: number;

    private _bbox?: IBoundingBox;

    /**
     * Use this to check if this circle's intersection cache is stale.
     */
    public isStale: boolean = false;

    public shape: object | undefined;

    // TODO: Outer contour if the circle is alone, but never if it has parents
    public isOuterContour: boolean = false;

    /**
     * Instantiate a new circle entity.
     */
    constructor(center: Point, radius: number, id?: any) {
        super();
        this._center = center;
        this._center.onGeometryChange = this.onCenterMove;
        this._radius = radius;
        this.id = id;
        this._internalId = Circle.internalCounter++;
    }

    /**
     * Helper method which creates a new circle with the same
     * coordinates as this one. If no id is provided, the clone will
     * have no circle ID (it will not clone the original's).
     */
    public clone = (id?: any) => {
        return new Circle(this._center, this._radius);
    }

    /**
     * Sets this circle's stale status to stale.
     */
    public setStale = () => {
        this.isStale = true;
        this.isOuterContour = false;
    }

    public onCenterMove = () => {
        this._resetCommonGeometryCaches();
        this.setStale();
        this.emit(EGeometryEventType.move);
    }

    public addVertex(vertex: CircleVertex) {
        if (this._vertices.includes(vertex) || this._vertices.some(v => v.node === vertex.node)) {
            return;
        }

        this._vertices.push(vertex);
        this._sortedVertices = false;
        this.setStale();
    }

    public removeVertexByNode(node: GraphNode) {
        if (!this._vertices.some(v => v.node === node)) {
            return;
        }

        this._vertices = this._vertices.filter(v => v.node !== node);
        this.setStale();
        // they are still sorted
    }

    public getVertexByNode(node: GraphNode): CircleVertex | undefined {
        return this._vertices.find(v => v.node === node);
    }

    /**
     * Retrieve this circle's vertices (i.e. intersection points with other circles)
     */
    public get vertices(): CircleVertex[] {
        if (this._sortedVertices) {
            return this._vertices;
        }

        this._vertices = this._vertices.sort((a, b) => a.angle - b.angle);
        this._sortedVertices = true;
        return this._vertices;
    }

    /**
     * Retrieve this circle's center coordinates.
     */
    get center(): Point {
        return this._center;
    }

    /**
     * This circle's radius.
     */
    get radius(): number {
        return this._radius;
    }

    /**
     * Move this circle.
     */
    set center(center: Point) {
        this._center.onGeometryChange = undefined;
        this._center = center;
        this._center.onGeometryChange = this.onCenterMove;
        this._resetCommonGeometryCaches();
        this.emit(EGeometryEventType.move);
    }

    /**
     * Change this circle's radius.
     */
    set radius(radius: number) {
        this._area = undefined;
        this._radius = radius;
        this._resetCommonGeometryCaches();
        this.emit(EGeometryEventType.resize);
    }

    private _resetCommonGeometryCaches = () => {
        this._bbox = undefined;
        this._roundedBbox = undefined;
        this._vertices = [];
        this.isStale = true;
    }

    /**
     * Retrieve this circle's area.
     */
    public get area(): number {
        if (this._area !== undefined) {
            return this._area;
        }

        return this._area = Math.PI * this.radius ** 2;
    }

    public get boundingBox(): IBoundingBox {
        if (this._bbox !== undefined) {
            return this._bbox;
        }

        return this._bbox = {
            minPoint: {
                x: this.center.x - this.radius,
                y: this.center.y - this.radius,
            },
            maxPoint: {
                x: this.center.x + this.radius,
                y: this.center.y + this.radius,
            }
        };
    }

    public get roundedBoundingBox(): IBoundingBox {
        if (this._roundedBbox !== undefined) {
            return this._roundedBbox;
        }

        return this._roundedBbox = {
            minPoint: Point.computeRoundedPoint(this.boundingBox.minPoint),
            maxPoint: Point.computeRoundedPoint(this.boundingBox.maxPoint),
        };
    }

    public isPointInside = (point: Point, exact: boolean = false): boolean => {
        if (!this.isPointInsideBBox(point, exact)) {
            return false;
        }

        let centerPoint: Point;
        let radiusSquared = this.radius ** 2;
        if (exact) {
            centerPoint = this.center;
        } else {
            centerPoint = this.center.roundedPoint;
            radiusSquared = round(radiusSquared);
        }

        let pointDistFromCenterSquared = (centerPoint.x - point.x) ** 2 + (centerPoint.y - point.y) ** 2;
        if (exact) {
            pointDistFromCenterSquared = round(pointDistFromCenterSquared);
        }

        return pointDistFromCenterSquared <= radiusSquared;
    }

    private isPointInsideBBox = (point: Point, exact: boolean = false): boolean => {
        if (!exact) {
            return (
                point.x >= this.boundingBox.minPoint.x &&
                point.x <= this.boundingBox.maxPoint.x &&
                point.y >= this.boundingBox.minPoint.y &&
                point.y <= this.boundingBox.maxPoint.y
            );
        }

        const rPoint = point.roundedPoint;
        return (
            rPoint.x >= this.roundedBoundingBox.minPoint.x &&
            rPoint.x <= this.roundedBoundingBox.maxPoint.x &&
            rPoint.y >= this.roundedBoundingBox.minPoint.y &&
            rPoint.y <= this.roundedBoundingBox.maxPoint.y
        );
    }

    // TODO: This is not particularly conductive to lazy evaluation, could it be done more efficiently for most cases?
    public boundingBoxOverlap = (that: Circle): boolean => (
        Math.sign(this.boundingBox.minPoint.x - that.boundingBox.maxPoint.x) != Math.sign(this.boundingBox.maxPoint.x - that.boundingBox.minPoint.x) &&
        Math.sign(this.boundingBox.minPoint.y - that.boundingBox.maxPoint.y) != Math.sign(this.boundingBox.maxPoint.y - that.boundingBox.minPoint.y)
    );

    public equals = (that: Circle): boolean => (
        this.center.roundedPoint.x == that.center.roundedPoint.x &&
        this.center.roundedPoint.y == that.center.roundedPoint.y &&
        this.roundedRadius == that.roundedRadius
    );

    public get roundedRadius(): number {
        if (this._roundedRadius !== undefined) {
            return this._roundedRadius;
        }

        return this._roundedRadius = round(this._radius);
    }

    public get internalId(): number {
        return this._internalId;
    }
}
