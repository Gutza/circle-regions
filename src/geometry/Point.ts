import { EGeometryEventType, IPoint } from "../Types";
import { PureGeometry } from "./PureGeometry";
import { round } from "./utils/numbers";

/**
 * A very basic 2D point class which emits
 * slim events when the coordinates are changed.
 */
export class Point extends PureGeometry implements IPoint {
    private _x: number;
    private _y: number;
    private _roundedPoint?: Point;

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
        this._roundedPoint = undefined;
        this.emit(EGeometryEventType.move);
    }

    /**
     * Set the point's y coordinate, and emit a move event.
     */
    public set y(y: number) {
        this._y = y;
        this._roundedPoint = undefined;
        this.emit(EGeometryEventType.move);
    }

    /**
     * Retrieve a point with rounded coordinates.
     * 
     */
    public get roundedPoint(): Point {
        if (this._roundedPoint !== undefined) {
            return this._roundedPoint;
        }
        return this._roundedPoint = Point.computeRoundedPoint(this);
    }

    public static computeRoundedPoint = (point: IPoint): Point => {
        return new Point(round(point.x), round(point.y));
    }
}