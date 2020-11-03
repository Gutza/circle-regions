import { Circle } from "./geometry/Circle";
import { TCircleRegions } from "./Types";
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
        this._staleRegions = false;

        if (this._circles.includes(circle)) {
            console.warn(`Circle with center (${circle.center.x}, ${circle.center.y}), radius ${circle.radius} and ID ${circle.id} already exists.`);
            return;
        }

        if (!guaranteedNew && this._circles.some(gc => gc.equals(circle))) {
            console.warn(`Another circle with center (${circle.center.x}, ${circle.center.y}) and radius ${circle.radius} already exists."`);
            return;
        }

        circle.isDirty = true;
        circle.onGeometryChange = () => this.onCircleChange(circle);
        this._circles.push(circle);
    };

    // TODO: Make sure this really is computationally cheap -- right now it isn't.
    // TODO: See https://stackoverflow.com/questions/30304719/javascript-fastest-way-to-remove-object-from-array
    /**
     * Remove an existing circle from the engine.
     * Guaranteed computationally cheap.
     * @param circle The circle to remove.
     */
    public removeCircle = (circle: Circle) => {
        circle.onGeometryChange = undefined;
        this._circles = this._circles.filter(c => c !== circle);
        this._staleRegions = false;
    };

    /**
     * Check if the regions are unchanged. Requires no computation.
     */
    public get isStale(): boolean {
        return this._staleRegions;
    }

    /**
     * Retrieve the current regions. This is the beef.
     * The engine caches everything it can, and only computes what it must.
     * This method is the cheapest of all, if nothing changed since the last time it was called,
     * or the most expensive of all, if everything changed.
     */
    public get regions(): TCircleRegions {
        if (this._staleRegions) {
            return this._regions;
        }

        try {
            this.recomputeRegions();
        } catch(e) {
            throw({
                Message: "An error occurred while processing the regions. Please submit a bug report including all information in this message.",
                InnerException: e,
                CircleDump: JSON.stringify(this.circles.map(circle => {
                    return [
                        circle.id,
                        circle.radius,
                        circle.center.x,
                        circle.center.y,
                    ];
                })),
            });
        }

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