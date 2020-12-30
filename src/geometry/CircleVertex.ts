import GraphNode from "../topology/GraphNode";
import { Circle } from "./Circle";
import { normalizeAngle } from "./utils/angles";

export default class CircleVertex {
    private _angle: number;
    private _arithmeticAngle: number;
    private _node: GraphNode;

    constructor(node: GraphNode, circle: Circle) {
        this._node = node;
        this._arithmeticAngle = Math.atan2(node.coordinates.y - circle.center.y, node.coordinates.x - circle.center.x);
        this._angle = normalizeAngle(this._arithmeticAngle);
    }

    public get angle(): number {
        return this._angle;
    }

    public get arithmeticAngle(): number {
        return this._arithmeticAngle;
    }

    public get node(): GraphNode {
        return this._node;
    }
}