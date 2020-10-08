import Circle from "../geometry/Circle";
import CircleLoop from "./CircleLoop";
import CircleNode from "./CircleNode";

export default class CircleEdge {
    private _circle: Circle;
    private _node1: CircleNode;
    private _node2: CircleNode;

    public id?: any;

    public RegionLeft: undefined | CircleLoop | null = undefined;
    public RegionRight: undefined | CircleLoop | null = undefined;

    constructor(circle: Circle, node1: CircleNode, node2: CircleNode, id?: any) {
        this._circle = circle;
        this._node1 = node1;
        this._node2 = node2;
        this.id = id;
    }

    public get node1(): CircleNode {
        return this._node1;
    }

    public get node2(): CircleNode {
        return this._node2;
    }

    public get circle(): Circle {
        return this._circle;
    }
}