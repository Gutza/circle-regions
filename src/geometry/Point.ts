import { EventEmitter } from "events";
import { IPoint, onMoveEvent } from "../Types";

export class Point extends EventEmitter implements IPoint {
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
        this.emit(onMoveEvent, this);
    }

    public set y(y: number) {
        this._y = y;
        this.emit(onMoveEvent, this);
    }
}