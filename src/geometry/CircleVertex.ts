import GraphNode from "../topology/GraphNode";
import Circle from "./Circle";
import { atan2, normalizeAngle } from "./utils/angles";

export default class CircleVertex {
    private _angle: number;
    private _node: GraphNode;

    constructor(node: GraphNode, circle: Circle) {
        this._node = node;
        this._angle = normalizeAngle(atan2(circle.center, node.coordinates));
    }

    public get angle(): number {
        return this._angle;
    }

    public get node(): GraphNode {
        return this._node;
    }
}