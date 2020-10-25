import { IDrawable, TRegionType } from "../Types";
import CircleArc from "./CircleArc";

export class ArcPolygon implements IDrawable {
    public shape: object | undefined;
    public id: any;
    
    private _arcs: CircleArc[];
    private _regionType: TRegionType;

    constructor(arcs: CircleArc[], regionType: TRegionType) {
        this._arcs = arcs;
        this._regionType = regionType;
    }

    public get arcs(): CircleArc[] {
        return this._arcs;
    }

    public get regionType(): TRegionType {
        return this._regionType;
    }
}