import { IBoundingBox, IRegion, onMoveEvent, onResizeEvent } from "../Types";
import CircleVertex from "./CircleVertex";
import GraphNode from "../topology/GraphNode";
import { EventEmitter } from "events";
import { round } from "./utils/numbers";
import { Point } from "./Point";

/**
 * The main circle class.
 */
export class Circle extends EventEmitter implements IRegion {
    protected _vertices: CircleVertex[] = [];
    private _sortedVertices: boolean = true;

    public id: any;

    /**
     * This circle's "children" (i.e. other circles from the intersection set which are fully enclosed in this one).
     */
    private _children: Circle[] = [];

    /**
     * This circle's "parents" (i.e. other circles from the intersection set which fully enclose this one).
     */
    private _parents: Circle[] = [];

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

    /**
     * Instantiate a new circle entity.
     */
    constructor(center: Point, radius: number, id?: any) {
        super();

        this._center = center;
        this._center.on(onMoveEvent, this.onCenterMove);
        this._radius = radius;
        this.id = id;
    }

    public onCenterMove = (center: Point) => {
        this._resetCommonGeometryCaches();
        this.isDirty = true;
        this.emit(onMoveEvent, this);
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
        if (this._vertices === undefined) {
            return undefined;
        }

        let vertices = this._vertices.filter(v => v.node === node);
        if (vertices.length == 0) {
            return undefined;
        }

        if (vertices.length > 1) {
            throw new Error("Multiple vertices with the same node on the same circle!");
        }

        return vertices[0];
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
        this._center.removeListener(onMoveEvent, this.onCenterMove);
        this._center = center;
        this._center.on(onMoveEvent, this.onCenterMove);
        this._resetCommonGeometryCaches();
        this.emit(onMoveEvent, this);
    }

    /**
     * Change this circle's radius.
     */
    set radius(radius: number) {
        this._area = undefined;
        this._radius = radius;
        this._resetCommonGeometryCaches();
        this.emit(onResizeEvent, this);
    }

    private _resetCommonGeometryCaches = () => {
        this._bbox = undefined;
        this._vertices = [];
        this.isDirty = true;
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

    public boundingBoxOverlap = (that: Circle): boolean => (
        Math.sign(this.boundingBox.minPoint.x - that.boundingBox.maxPoint.x) * Math.sign(this.boundingBox.maxPoint.x - that.boundingBox.minPoint.x) < 0.5 &&
        Math.sign(this.boundingBox.minPoint.y - that.boundingBox.maxPoint.y) * Math.sign(this.boundingBox.maxPoint.y - that.boundingBox.minPoint.y) < 0.5
    );

    public equals = (that: Circle): boolean => (
        round(this.center.x) == round(that.center.x) &&
        round(this.center.y) == round(that.center.y) &&
        round(this.radius) == round(that.radius)
    );

}
