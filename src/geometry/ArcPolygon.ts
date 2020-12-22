import { IDrawable, ERegionType } from "../Types";
import CircleArc from "./CircleArc";

/**
 * Think of a polygon. Now imagine a polygon with edges made of circle arcs
 * instead of line segments. That's an @see ArcPolygon.
 */
export class ArcPolygon implements IDrawable {
    public shape: object | undefined;
    public id: any;
    
    private _arcs: CircleArc[];
    private _regionType: ERegionType;
    
    constructor(arcs: CircleArc[], regionType: ERegionType) {
        this._arcs = arcs;
        this._regionType = regionType;
    }

    public get arcs(): CircleArc[] {
        return this._arcs;
    }

    public get regionType(): ERegionType {
        return this._regionType;
    }
}