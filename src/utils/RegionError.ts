import { Circle } from "../geometry/Circle";

export class RegionError extends Error {
    private _innerError: Error;
    private _circles: Circle[];
    private _isStatic: boolean | undefined;

    constructor(message: string, originalError: Error, regionCircles: Circle[], isStatic?: boolean) {
        super(message);
        this._circles = regionCircles;
        this.message += " Circles: " + this.circleDump + " Inner error: " + originalError.message;
        this._innerError = originalError;
        this._isStatic = isStatic;
    }

    public static circlesToString = (circles: Circle[]): string => {
        return JSON.stringify(circles.map(
            circle => ([
                circle.center.x,
                circle.center.y,
                circle.radius,
                circle.internalId,
            ])
        ));
    }

    public get circleDump(): string {
        return RegionError.circlesToString(this._circles);
    }

    public get circles(): Circle[] {
        return this._circles;
    }

    public get isStatic(): boolean | undefined {
        return this._isStatic;
    }

    public get innerError(): Error {
        return this._innerError;
    }
}