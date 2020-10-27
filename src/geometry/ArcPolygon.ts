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

        let intAngDiff = {
            "start": 0,
            "mid": 0,
            "end": 0,
        }, fracTot = 0;

        for (let arcIndex = 0; arcIndex < this._arcs.length;) {
            // Do NOT break early, this is only guaranteed to resolve
            // properly after traversing all arcs in the contour!
            const currArc = this._arcs[arcIndex];
            const nextArc = this._arcs[++arcIndex] || this._arcs[0];

            const sArc1 = currArc.startAngle;
            const sArc2 = nextArc.startAngle - (currArc.startAngle > nextArc.startAngle ? TWO_PI : 0);
            intAngDiff.start += sArc2 - sArc1;

            const eArc1 = currArc.endAngle;
            const eArc2 = nextArc.endAngle - (currArc.endAngle > nextArc.endAngle ? TWO_PI : 0);
            intAngDiff.end += eArc2 - eArc1;

            const mArc1 = currArc.midAngle;
            const mArc2 = nextArc.midAngle - (currArc.midAngle > nextArc.midAngle ? TWO_PI : 0);
            intAngDiff.mid += mArc2 - mArc1;

            fracTot += currArc.unitLength;
        }
        
        console.log(
            "intAngDiff start", Math.round(intAngDiff.start/Math.PI*180),
            "mid", Math.round(intAngDiff.mid/Math.PI*180),
            "end", Math.round(intAngDiff.end/Math.PI*180),
            "fracTot", fracTot
        );
        //this._contourType = intAngDiff < -6.2832 ? TContourType.outer : TContourType.inner;
        this._contourType = TContourType.outer;
        return this._contourType;
    }
}