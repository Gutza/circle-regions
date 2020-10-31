import { EGeometryEventType, IPoint } from "../Types";
import { PureGeometry } from "./PureGeometry";

/**
 * A very basic 2D point class which emits
 * slim events when the coordinates are changed.
 */
export class Point extends PureGeometry implements IPoint {
    private _x: number;
    private _y: number;

    /**
     * Create a new point.
     * @param x The point's x coordinate.
     * @param y The point's y coordinate.
     */
    constructor(x: number, y: number) {
        super();
        this._x = x;
        this._y = y;
    }

    /**
     * Retrieve the point's x coordinate.
     */
    public get x(): number {
        return this._x;
    }

    /**
     * Retrieve the point's y coordinate.
     */
    public get y(): number {
        return this._y;
    }

    /**
     * Set the point's x coordinate, and emit a move event.
     */
    public set x(x: number) {
        this._x = x;
        this.emit(EGeometryEventType.move);
    }

    /**
     * Set the point's y coordinate, and emit a move event.
     */
    public set y(y: number) {
        this._y = y;
        this.emit(EGeometryEventType.move);
    }
}