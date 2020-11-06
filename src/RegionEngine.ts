import { Circle } from "./geometry/Circle";
import { ERegionDebugMode, TCircleRegions } from "./Types";
import GraphNode from "./topology/GraphNode";
import { RegionEngineBL } from "./RegionEngineBL";
import { DebugEngine } from "./DebugEngine";
import { RegionError } from "./geometry/utils/RegionError";

/**
 * The main engine for computing regions resulted from intersecting circles.
 */
export class RegionEngine extends RegionEngineBL {
    /**
     * Instantiate a new region engine.
     * 
     * @param debugMode The debug mode. For most cases, static should be fine.
     */
    constructor(debugMode: ERegionDebugMode = ERegionDebugMode.static) {
        super(debugMode);
    }
    /**
     * Add a circle to the engine.
     * Computationally cheap, unless there are many circles AND @see guaranteedNew is false.
     * @param circle The circle to add.
     * @param guaranteedNew Set to true if there is an external mechanism which ensures this is geometrically distinct from every other circle already added.
     */
    public addCircle = (circle: Circle, guaranteedNew: boolean = false) => {
        this._staleRegions = false;

        if (!guaranteedNew && this._circles.some(existingCircle => existingCircle.equals(circle))) {
            console.warn(`Another circle with center (${circle.center.x}, ${circle.center.y}) and radius ${circle.radius} already exists."`);
            return;
        }

        const newCircle = new Circle(circle.center, circle.radius, circle.id);
        newCircle.isDirty = true;
        newCircle.onGeometryChange = () => this.onCircleChange(newCircle);

        // We always want to create new circles, in order to remove their vertex and edge caches
        this._circles.push(newCircle);
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
            if (this._debugMode === ERegionDebugMode.none) {
                throw new RegionError(
                    "An error has occurred while processing the regions. You're running in debugMode=none, so no static/dynamic tests have been performed.",
                    e as Error,
                    this.circles,
                    undefined
                );
            }

            const canonicalCircles = DebugEngine.checkStatic(this.circles);

            if (canonicalCircles.length > 0) {
                throw new RegionError(
                    "A statically reproducible error has occurred while processing the regions. Please submit a bug report including all information in this message.",
                    e as Error,
                    canonicalCircles,
                    true
                );
            }

            // TODO: Attempt dynamic reproducing, as well
            throw new RegionError(
                "A statically unreproducible error has occurred while processing the regions: " + e.message,
                e as Error,
                this.circles,
                false
            );
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