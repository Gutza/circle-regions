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

        let
            intAngDiff = 0,

        for (let arcIndex = 0; arcIndex < this._arcs.length;) {
            const currArc = this._arcs[arcIndex];
            const nextArc = this._arcs[++arcIndex] || this._arcs[0];

            /*
            console.log(
                this.toDeg(currArc.startAngle),
                this.toDeg(currArc.midAngle),
                this.toDeg(currArc.endAngle),
                "»»»",
                this.toDeg(nextArc.startAngle),
                this.toDeg(nextArc.midAngle),
                this.toDeg(nextArc.endAngle)
            );

            const angDiff = nextArc.startAngle - currArc.startAngle;
            //console.log("angDiff", angDiff);
            intAngDiff += angDiff;
            */

            const midArc1 = currArc.midAngle;
            const midArc2 = nextArc.midAngle - (currArc.midAngle > nextArc.midAngle ? TWO_PI : 0);
            intAngDiff += midArc2 - midArc1;
        }

        console.log("intAngDiff", this.toDeg(intAngDiff));
        this._contourType = intAngDiff < -7 ? TContourType.outer : TContourType.inner;
        return this._contourType;
    }

    private toDeg(rad: number): string {
        return Math.round(rad * 180 / Math.PI).toString();
    }
}