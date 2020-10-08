import CircleArc from "./CircleArc";

export default class CircleRegion {
    private _arcs: CircleArc[];

    constructor(arcs: CircleArc[]) {
        this._arcs = arcs;
    }

    public get arcs(): CircleArc[] {
        return this._arcs;
    }
}