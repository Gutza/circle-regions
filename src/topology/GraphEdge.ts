import { Circle } from "../geometry/Circle";
import { IGraphCycle } from "../Types";
import GraphNode from "./GraphNode";

export default class GraphEdge {
    private _circle: Circle;
    private _node1: GraphNode;
    private _node2: GraphNode;

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

    constructor(circle: Circle, node1: GraphNode, node2: GraphNode, id: string) {
        this._circle = circle;
        this._node1 = node1;
        this._node2 = node2;
        this.id = id;
    }

    public get node1(): GraphNode {
        return this._node1;
    }

    public get node2(): GraphNode {
        return this._node2;
    }

    public get circle(): Circle {
        return this._circle;
    }

    public equals = (that: GraphEdge): boolean => {
        return this.circle === that.circle && this.node1 === that.node1 && this.node2 === that.node2;
    }
}