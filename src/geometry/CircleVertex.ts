import CircleNode from "../topology/CircleNode";
import Circle from "./Circle";
import { atan2, normalizeAngle } from "./utils/angles";

export default class CircleVertex {
    private _angle: number;
    private _node: CircleNode;

    constructor(node: CircleNode, circle: Circle) {
        this._node = node;
        this._angle = normalizeAngle(atan2(circle.center, node.coordinates));
    }

    public get angle(): number {
        return this._angle;
    }

    public get node(): CircleNode {
        return this._node;
    }
}