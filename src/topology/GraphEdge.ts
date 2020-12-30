import { Circle } from "../geometry/Circle";
import CircleVertex from "../geometry/CircleVertex";
import { IGraphCycle } from "../Types";
import GraphNode from "./GraphNode";

export default class GraphEdge {
    private _circle: Circle;
    private _node1: GraphNode;
    private _node2: GraphNode;
    private _vertex1: CircleVertex;
    private _vertex2: CircleVertex;

    public id: string;

    /**
     * The inner cycle this edge belongs to.
     * Undefined means uncomputed; null means it was computed and
     * there isn't any (e.g. a circle with a single outer tangency point).
     */
    public InnerCycle: undefined | IGraphCycle | null = undefined;

    /**
     * The outer cycle this edge belongs to.
     * Undefined means uncomputed; null means it was computed and
     * there isn't any (e.g. a circle with a single inner tangency point).
     */
    public OuterCycle: undefined | IGraphCycle | null = undefined;

    constructor(circle: Circle, vertex1: CircleVertex, vertex2: CircleVertex, id: string) {
        this._circle = circle;
        this._node1 = vertex1.node;
        this._node2 = vertex2.node;
        this._vertex1 = vertex1;
        this._vertex2 = vertex2;
        this.id = id;
    }

    public get node1(): GraphNode {
        return this._node1;
    }

    public get node2(): GraphNode {
        return this._node2;
    }

    public get vertex1(): CircleVertex {
        return this._vertex1;
    }

    public get vertex2(): CircleVertex {
        return this._vertex2;
    }

    public get circle(): Circle {
        return this._circle;
    }

    public equals = (that: GraphEdge): boolean => {
        return this.circle === that.circle && this.node1 === that.node1 && this.node2 === that.node2;
    }
}