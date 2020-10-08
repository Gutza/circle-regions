import Circle from "../geometry/Circle";
import intersectCircles from "../geometry/utils/intersectCircles";
import { round } from "../geometry/utils/round";
import { IPoint, TIntersectionType } from "../Types";
import CircleEdge from "./CircleEdge";
import CircleNode from "./CircleNode";
import TangencyGroup from "./TangencyGroup";

export default class CircleGraph {
    private _nodes: CircleNode[];
    private _edges: CircleEdge[];
    private _circles: Circle[];

    constructor() {
        this._circles = [];
        this._nodes = [];
        this._edges = [];
    }

    public addNode(circle1: Circle, circle2: Circle, intersectionPoint: IPoint, intersectionType: TIntersectionType) {
        let sameCoordinates = this._nodes.filter(n =>
            round(n.coordinates.x) === round(intersectionPoint.x) &&
            round(n.coordinates.y) === round(intersectionPoint.y)
        );
        if (sameCoordinates.length > 1) {
            throw new Error("Unexpected condition: multiple nodes with the same coordinates!");
        }

        if (sameCoordinates.length == 1) {
            sameCoordinates[0].addCirclePair(circle1, circle2, intersectionType);
            return;
        }
        
        const newNode = new CircleNode(intersectionPoint);
        newNode.addCirclePair(circle1, circle2, intersectionType);
        this._nodes.push(newNode);
    }

    public addEdge(edge: CircleEdge) {
        this._edges.push(edge);
    }

    public addCircle = (circle: Circle) => {
        this._circles.forEach(otherCircle => {
            intersectCircles(this, circle, otherCircle);
        });
        this._circles.push(circle);
    }

    public removeCircle(circle: Circle) {
        this._nodes.forEach(n => n.removeCircle(circle));
        this._nodes = this._nodes.filter(n => n.isValid()); // a valid node represents a valid intersection
    }

    public get nodes(): CircleNode[] {
        return this._nodes;
    }
}