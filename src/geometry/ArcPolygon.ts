import { IDrawable, TContourType, TRegionType } from "../Types";
import CircleArc from "./CircleArc";
import { TWO_PI } from "./utils/angles";

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

        if (this.regionType !== TRegionType.contour) {
            this._contourType = TContourType.notContour;
            return this._contourType;
        }

        // There can't be an inner contour defined by less than three circles.
        if (this._arcs.length < 3) {
            this._contourType = TContourType.outer;
            return this._contourType;
        }

        let intAngDiff = 0;

        for (let arcIndex = 0; arcIndex < this._arcs.length;) {
            // Do NOT break early, this is only guaranteed to resolve
            // properly after traversing all arcs in the contour!
            const currArc = this._arcs[arcIndex];
            const nextArc = this._arcs[++arcIndex] || this._arcs[0];

            const midArc1 = currArc.startAngle;
            const midArc2 = nextArc.startAngle - (currArc.startAngle > nextArc.startAngle ? TWO_PI : 0);
            intAngDiff += midArc2 - midArc1;
        }
        
        this._contourType = intAngDiff < -6.2832 ? TContourType.outer : TContourType.inner;
        return this._contourType;
    }
}