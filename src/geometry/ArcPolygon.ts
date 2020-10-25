import { IDrawable, TContourType, TRegionType } from "../Types";
import CircleArc from "./CircleArc";

export class ArcPolygon implements IDrawable {
    public shape: object | undefined;
    public id: any;
    
    private _arcs: CircleArc[];
    private _regionType: TRegionType;
    private _contourType: TContourType | undefined;

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

    public get contourType(): TContourType {
        if (this._contourType !== undefined) {
            return this._contourType;
        }

        let
            centerPerimeter2 = 0,
            regionPerimeter2 = 0;

        for (let arcIndex = 0; arcIndex < this._arcs.length-1;) {
            const currArc = this._arcs[arcIndex];
            const nextArc = this._arcs[++arcIndex];

            const dcx = currArc.circle.center.x - nextArc.circle.center.x;
            const dcy = currArc.circle.center.y - nextArc.circle.center.y;
            centerPerimeter2 += dcx * dcx + dcy * dcy;

            const dax = currArc.startPoint.x - nextArc.startPoint.x;
            const day = currArc.startPoint.y - nextArc.startPoint.y;
            regionPerimeter2 += dax * dax + day * day;
        }

        this._contourType = centerPerimeter2 < regionPerimeter2 ? TContourType.outer : TContourType.inner;
        return this._contourType;
    }
}