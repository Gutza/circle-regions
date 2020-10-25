import { IPoint } from "../Types";
import { Circle } from "./Circle";
import { TWO_PI } from "./utils/angles";

export default class CircleArc {
    private _circle: Circle;
    private _startAngle: number;
    private _endAngle: number;
    private _startPoint: IPoint;
    private _endPoint: IPoint;
    private _isClockwise: boolean;
    private _unitLength: number | undefined;
    private _midAngle: number | undefined;
    private _midPoint: IPoint | undefined;

    constructor(circle: Circle, startAngle: number, endAngle: number, startPoint: IPoint, endPoint: IPoint, isClockwise: boolean) {
        this._circle = circle;
        this._startAngle = startAngle;
        this._endAngle = endAngle;
        this._startPoint = startPoint;
        this._endPoint = endPoint;
        this._isClockwise = isClockwise;
    }

    /**
     * If false, the arc begins at startAngle and continues
     * in trigonometric direction to endAngle.
     * If true, the arc begins at startAngle and continues
     * in clockwise direction to endAngle.
     */
    public get isClockwise(): boolean {
        return this._isClockwise;
    }
    
    public get circle(): Circle {
        return this._circle;
    }

    /**
     * The start angle of this arc on the circle, in the
     * proper order for traversing the region. The two angles
     * are denormalized in such a way that you can always traverse
     * algebrically from startAngle to endAngle.
     */
    public get startAngle(): number {
        return this._startAngle;
    }

    /**
     * The end angle of this arc on the circle, in the
     * proper order for traversing the region. The two angles
     * are denormalized in such a way that you can always traverse
     * algebrically from startAngle to endAngle.
     */
    public get endAngle(): number {
        return this._endAngle;
    }

    public get startPoint(): IPoint {
        return this._startPoint;
    }

    public get endPoint(): IPoint {
        return this._endPoint;
    }

    /**
     * The fraction of the length of the circle represented by this arc.
     * Computed lazily; cached.
     */
    public get unitLength(): number {
        if (this._unitLength !== undefined) {
            return this._unitLength;
        }

        this._unitLength = Math.abs(this.endAngle - this.startAngle) / TWO_PI;
        return this._unitLength;
    }

    public get midAngle(): number {
        if (this._midAngle !== undefined) {
            return this._midAngle;
        }

        this._midAngle = (this._startAngle + this._endAngle) / 2;
        return this._midAngle;
    }

    public get midPoint(): IPoint {
        if (this._midPoint !== undefined) {
            return this._midPoint;
        }

        this._midPoint = {
            x: 0,
            y: 0,
        };

        this._midPoint.x = this._circle.center.x + this._circle.radius * Math.cos(this.midAngle);
        this._midPoint.y = this._circle.center.y + this._circle.radius * Math.sin(this.midAngle);

        return this._midPoint;
    }
}