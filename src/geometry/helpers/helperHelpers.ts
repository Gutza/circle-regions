import { CircleArc } from "../CircleArc";
import { TWO_PI } from "../utils/angles";

export function makeSafeRenderingArc(arc: CircleArc): CircleArc {
    if (arc.startAngle != arc.endAngle) {
        return arc;
    }

    if (arc.isClockwise) {
        return new CircleArc(arc.circle, arc.startAngle + TWO_PI, arc.endAngle, arc.startPoint, arc.endPoint, true);
    } else {
        return new CircleArc(arc.circle, arc.startAngle, arc.endAngle + TWO_PI, arc.startPoint, arc.endPoint, false);
    }
}