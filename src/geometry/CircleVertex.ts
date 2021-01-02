import GraphNode from "../topology/GraphNode";
import { Circle } from "./Circle";
import { normalizeAngle } from "./utils/angles";

/**
 * A simple class which only knows which @see GraphNode it belongs to,
 * and at what angle it's placed on the circle it belongs to.
 * It does NOT know which specific circle it actually belongs to;
 * that's the responsibility of the @see Circle class instead.
 */
export default class CircleVertex {
    private _angle: number;
    private _arithmeticAngle: number;
    private _node: GraphNode;

    constructor(node: GraphNode, circle: Circle) {
        this._node = node;
        this._arithmeticAngle = Math.atan2(node.coordinates.y - circle.center.y, node.coordinates.x - circle.center.x);
        this._angle = normalizeAngle(this._arithmeticAngle);
    }

    /**
     * This vertex's normalized angle on the circle ([0..2π)).
     */
    public get angle(): number {
        return this._angle;
    }

    /**
     * This vertex's arithmetic angle on the circle ([-π..π]).
     */
    public get arithmeticAngle(): number {
        return this._arithmeticAngle;
    }

    /**
     * The node this vertex belongs to.
     */
    public get node(): GraphNode {
        return this._node;
    }
}