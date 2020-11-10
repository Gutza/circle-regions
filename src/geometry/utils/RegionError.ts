import { Circle } from "../Circle";

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

        // TODO: If static, reduce the circles to the minimum set which still generates the exception.
    }

    public get circleDump(): string {
        return JSON.stringify(this._circles.map(circle => {
            return [
                circle.center.x,
                circle.center.y,
                circle.radius,
            ];
        }));
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