import { IPoint, IRegion } from "../Types";
import CircleVertex from "./CircleVertex";
import GraphNode from "../topology/GraphNode";
import { EventEmitter } from "events";

/**
 * The main circle class.
 */
export class Circle extends EventEmitter implements IRegion {
    private _vertices: CircleVertex[] = [];
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
    constructor(center: IPoint, radius: number, id?: any) {
        super();

        this._center = center;
        this._radius = radius;
        this.id = id;
    }

    public addVertex(vertex: CircleVertex) {
        if (this._vertices.includes(vertex)) {
            return;
        }

        this._vertices.push(vertex);
        this._sortedVertices = false;
    }

    public removeVertexByNode(node: GraphNode) {
        this._vertices = this._vertices.filter(v => v.node !== node);
        // they are still sorted
    }

    public getVertexByNode(node: GraphNode): CircleVertex | undefined {
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
        this._vertices.forEach(v => console.log(v.angle));
        return this._vertices;
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
        this.emit("clearGeometryCache", this);
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
        this.emit("clearGeometryCache", this);
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
