import { EGeometryEventType, FOnGeometryEvent } from "../Types";

/**
 * A very slim event emitter base class.
 */
export class PureGeometry {
    public onGeometryChange: FOnGeometryEvent | undefined;

    protected emit = (evtype: EGeometryEventType) => {
        this.onGeometryChange && this.onGeometryChange(evtype, this);
    }
}