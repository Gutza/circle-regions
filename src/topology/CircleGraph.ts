import Circle from "../geometry/Circle";
import { IPoint, TIntersectionType } from "../Types";
import CircleEdge from "./CircleEdge";
import CircleNode from "./CircleNode";

export default class CircleGraph {
    private _nodes: CircleNode[];
    private _edges: CircleEdge[];
    private _circles: Circle[];

    constructor(circles: Circle[]) {
        this._circles = circles;
        this._nodes = [];
        this._edges = [];
    }

    public addNode(circle1: Circle, circle2: Circle, intersectionPoint: IPoint, intersectionType: TIntersectionType) {
    }

    public addEdge(edge: CircleEdge) {
        this._edges.push(edge);
    }

    public removeCircle(circle: Circle) {
        this._nodes.forEach(n => n.removeCircle(circle));
        this._nodes = this._nodes.filter(n => n.isValid()); // a valid node represents a valid intersection
    }


}