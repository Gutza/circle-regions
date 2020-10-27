import { EGeometryEventType, IPoint } from "../Types";
import { PureGeometry } from "./PureGeometry";

export class Point extends PureGeometry implements IPoint {
    private _x: number;
    private _y: number;

    constructor(x: number, y: number) {
        super();
        this._x = x;
        this._y = y;
    }

    public get x(): number {
        return this._x;
    }

    public get y(): number {
        return this._y;
    }

    public set x(x: number) {
        this._x = x;
        this.emit(EGeometryEventType.onMoveEvent);
    }

    public set y(y: number) {
        this._y = y;
        this.emit(EGeometryEventType.onMoveEvent);
    }

    private _emit = (evtype: EGeometryEventType) => {
        this.onGeometryEvent && this.onGeometryEvent(evtype, this);
    }
}