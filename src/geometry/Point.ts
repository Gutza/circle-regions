import { EventEmitter } from "events";
import { IPoint, IGeometryHandler } from "../Types";

export class Point extends EventEmitter implements IPoint {
    private _x: number;
    private _y: number;
    private _handler?: IGeometryHandler;

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

    public setGeometryHandler(handler: IGeometryHandler) {
        this._handler = handler;
    }

    public resetGeometryHandler() {
        this._handler = undefined;
    }

    public set x(x: number) {
        this._x = x;
        if (this._handler !== undefined) {
            this._handler.handleMove();
        }
    }

    public set y(y: number) {
        this._y = y;
        if (this._handler !== undefined) {
            this._handler.handleMove();
        }
    }
}