import { ICircleIntersection, ICircleIntersectionPoint } from "../Types";
import Circle from "./Circle";

export default class CircleSegment {
    private _circle: Circle;
    private _intersection1: ICircleIntersection;
    private _intersection2: ICircleIntersection;

    constructor(circle: Circle, intersection1: ICircleIntersection, intersection2: ICircleIntersection) {
        this._circle = circle;
        this._intersection1 = intersection1;
        this._intersection2 = intersection2;
    }
}