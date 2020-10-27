import { EGeometryEventType, FOnGeometryEvent } from "../Types";

export class PureGeometry {
    public onGeometryEvent: FOnGeometryEvent | undefined;

    protected emit = (evtype: EGeometryEventType) => {
        this.onGeometryEvent && this.onGeometryEvent(evtype, this);
    }

}