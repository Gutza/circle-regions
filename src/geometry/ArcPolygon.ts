import CircleArc from "./CircleArc";

export default class ArcPolygon {
    private _arcs: CircleArc[];
    private _isContour: boolean;

    constructor(arcs: CircleArc[], isContour: boolean) {
        this._arcs = arcs;
        this._isContour = isContour;
    }

    public get arcs(): CircleArc[] {
        return this._arcs;
    }

    public get isContour(): boolean {
        return this._isContour;
    }
}