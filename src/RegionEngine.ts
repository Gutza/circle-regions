import { Circle } from "./geometry/Circle";
import { TCircleRegions, onMoveEvent, onResizeEvent } from "./Types";
import GraphNode from "./topology/GraphNode";
import { RegionEngineBL } from "./RegionEngineBL";

/**
 * The main engine for computing regions resulted from intersecting circles.
 */
export class RegionEngine extends RegionEngineBL {
    /**
     * Add a circle to the engine.
     * Computationally cheap, unless there are many circles AND @see guaranteedNew is false.
     * @param circle The circle to add.
     * @param guaranteedNew Set to true if there is an external mechanism which ensures this is geometrically distinct from every other circle already added.
     */
    public addCircle = (circle: Circle, guaranteedNew: boolean = false) => {
        this._dirtyRegions = true;

        if (this._circles.includes(circle)) {
            console.warn(`Circle with center (${circle.center.x}, ${circle.center.y}), radius ${circle.radius} and ID ${circle.id} already exists.`);
            return;
        }

        if (!guaranteedNew && this._circles.some(gc => gc.equals(circle))) {
            console.warn(`Another circle with center (${circle.center.x}, ${circle.center.y}) and radius ${circle.radius} already exists."`);
            return;
        }

        circle.isDirty = true;
        circle.on(onMoveEvent, this.onCircleEvent);
        circle.on(onResizeEvent, this.onCircleEvent);
        this._circles.push(circle);
    }

    // TODO: Make sure this really is computationally cheap -- right now it isn't.
    // TODO: See https://stackoverflow.com/questions/30304719/javascript-fastest-way-to-remove-object-from-array
    /**
     * Remove an existing circle from the engine.
     * Guaranteed computationally cheap.
     * @param circle The circle to remove.
     */
    public removeCircle = (circle: Circle) => {
        circle.removeListener(onMoveEvent, this.onCircleEvent);
        circle.removeListener(onResizeEvent, this.onCircleEvent);
        this._circles = this._circles.filter(c => c !== circle);
        this._dirtyRegions = true;
    }

    /**
     * Check if the regions are unchanged. Requires no computation.
     */
    public get stale(): boolean {
        return !this._dirtyRegions;
    }

    /**
     * Retrieve the current regions. This is the beef.
     * The engine caches everything it can, and only computes what it must.
     * This method is the cheapest of all, if nothing changed since the last time it was called,
     * or the most expensive of all, if everything changed.
     */
    public get regions(): TCircleRegions {
        if (!this._dirtyRegions) {
            return this._regions;
        }

        this.recomputeRegions();

        return this._regions;
    }

    /**
     * Retrieve the current set of circles registered by the engine.
     */
    public get circles(): Circle[] {
        return this._circles;
    }

    /**
     * Retrieve the current set of nodes, as last computed by the engine.
     * This is always cheap, nodes are always retrieved from the cache.
     * Use @see regions instead if you want to re-compute the nodes.
     */
    public get nodes(): GraphNode[] {
        return this._nodes;
    }
}