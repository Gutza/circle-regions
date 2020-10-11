import { IPoint } from "../Types";
import { Circle } from "./Circle";

export default class CircleArc {
    private _circle: Circle;
    private _startAngle: number;
    private _endAngle: number;
    private _startPoint: IPoint;
    private _endPoint: IPoint;
    private _isClockwise: boolean;

    constructor(circle: Circle, startAngle: number, endAngle: number, startPoint: IPoint, endPoint: IPoint, isClockwise: boolean) {
        this._circle = circle;
        this._startAngle = startAngle;
        this._endAngle = endAngle;
        this._startPoint = startPoint;
        this._endPoint = endPoint;
        this._isClockwise = isClockwise;
    }

    public get isClockwise(): boolean {
        return this._isClockwise;
    }
    
    public get circle(): Circle {
        return this._circle;
    }

    public get startAngle(): number {
        return this._startAngle;
    }

    public get endAngle(): number {
        return this._endAngle;
    }

    public get startPoint(): IPoint {
        return this._startPoint;
    }

    public get endPoint(): IPoint {
        return this._endPoint;
    }

}