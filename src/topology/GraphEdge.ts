import Circle from "../geometry/Circle";
import GraphLoop from "./GraphLoop";
import GraphNode from "./GraphNode";

export default class GraphEdge {
    private _circle: Circle;
    private _node1: GraphNode;
    private _node2: GraphNode;

    public id?: any;

    public RegionLeft: undefined | GraphLoop | null = undefined;
    public RegionRight: undefined | GraphLoop | null = undefined;

    constructor(circle: Circle, node1: GraphNode, node2: GraphNode, id?: any) {
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
}