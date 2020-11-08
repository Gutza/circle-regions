import { EGeometryEventType, IBoundingBox, IDrawable, IRegion } from "../Types";
import CircleVertex from "./CircleVertex";
import GraphNode from "../topology/GraphNode";
import { round } from "./utils/numbers";
import { Point } from "./Point";
import { PureGeometry } from "./PureGeometry";

let circleCounter = 0;

/**
 * The main circle class.
 */
export class Circle extends PureGeometry implements IRegion, IDrawable {
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

    public isDirty: boolean = false; // it gets set to true when added to a RegionEngine

    public shape: object | undefined;

    /**
     * Instantiate a new circle entity.
     */
    constructor(center: Point, radius: number, id?: any) {
        super();
        this._center = center;
        this._center.onGeometryChange = this.onCenterMove;
        this._radius = radius;
        this.id = id;
        this._internalId = circleCounter++;
    }

    public onCenterMove = () => {
        this._resetCommonGeometryCaches();
        this.isDirty = true;
        this.emit(EGeometryEventType.move);
    }

    public addVertex(vertex: CircleVertex) {
        if (this._vertices.includes(vertex) || this._vertices.some(v => v.node === vertex.node)) {
            return;
        }

        this._vertices.push(vertex);
        this._sortedVertices = false;
        this.isDirty = true;
    }

    public removeVertexByNode(node: GraphNode) {
        if (!this._vertices.some(v => v.node === node)) {
            return;
        }

        this._vertices = this._vertices.filter(v => v.node !== node);
        this.isDirty = true;
        // they are still sorted
    }

    public getVertexByNode(node: GraphNode): CircleVertex | undefined {
        return this._vertices.find(v => v.node === node);
    }

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
        this.isDirty = true;
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

    // Using Point instead of IPoint in order to force programmers to use Point's caching mechanism
    public isPointInside = (point: Point, exact: boolean = false): boolean => {
        if (!exact) {
            return (
                point.x > this.boundingBox.minPoint.x &&
                point.x < this.boundingBox.maxPoint.x &&
                point.y > this.boundingBox.minPoint.y &&
                point.y < this.boundingBox.maxPoint.y
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
