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
            intAngDiff = 0,
            regionPerimeter2 = 0;

        for (let arcIndex = 0; arcIndex < this._arcs.length;) {
            const currArc = this._arcs[arcIndex];
            const nextArc = this._arcs[++arcIndex] || this._arcs[0];

            console.log("C", currArc.circle.center, "»", nextArc.circle.center);
            const dcx = currArc.circle.center.x - nextArc.circle.center.x;
            const dcy = currArc.circle.center.y - nextArc.circle.center.y;
            centerPerimeter2 += dcx * dcx + dcy * dcy;

            console.log("A", currArc.midPoint, "»", nextArc.midPoint);
            const dax = currArc.midPoint.x - nextArc.midPoint.x;
            const day = currArc.midPoint.y - nextArc.midPoint.y;
            regionPerimeter2 += dax * dax + day * day;

            intAngDiff += currArc.endAngle - currArc.startAngle;
        }

        console.log("intAngDiff", intAngDiff);
        this._contourType = centerPerimeter2 > regionPerimeter2 ? TContourType.inner : TContourType.outer;
        return this._contourType;
    }
}