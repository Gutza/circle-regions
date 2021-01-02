import { Circle } from "./geometry/Circle";
import { EDrawableEventType, ERegionDebugMode } from "./Types";
import GraphNode from "./topology/GraphNode";
import { RegionEngineBL } from "./RegionEngineBL";
import { DebugEngine } from "./DebugEngine";
import { RegionError } from "./geometry/utils/RegionError";
import { Point } from "./geometry/Point";
import { ArcPolygon } from "./geometry/ArcPolygon";

/**
 * The main engine for computing regions resulted from intersecting circles.
 */
export class RegionEngine extends RegionEngineBL {
    /**
     * Instantiate a new region engine.
     * 
     * @param debugMode The debug mode. You never need to change this for general use.
     */
    constructor(debugMode: ERegionDebugMode = ERegionDebugMode.static) {
        super(debugMode);
    }

    /**
     * Reset this region engine to pristine status.
     */
    public clear = () => {
        this._nodes = [];
        this._edges = new Map();
        
        this._regions.forEach(region => this.emit(EDrawableEventType.delete, region));
        this._regions = [];
        this._circles = [];

        this._staleRegions = false;
    }

    /**
     * Helper method which instantiates a new circle, calls @see addCircle(), and returns the newly-added @see Circle instance.
     * @param centerX The new circle's X coordinate
     * @param centerY The new circle's Y coordinate
     * @param radius The new circle's radius
     * @param circleId The new circle's ID
     * @param guaranteedNew Same as @see addCircle()'s guaranteedNew parameter
     * @returns The @see Circle entity that was just added to the region engine
     */
    public add = (centerX: number, centerY: number, radius: number, circleId?: any, guaranteedNew: boolean = false): Circle => {
        const newCircle = new Circle(new Point(centerX, centerY), radius, circleId);
        this.addCircle(newCircle, guaranteedNew);
        return newCircle;
    }

    /**
     * Add a circle to the engine.
     * Computationally cheap, unless there are many circles AND @see guaranteedNew is false.
     * @param circle The circle to add.
     * @param guaranteedNew Set to true if there is an external mechanism which ensures this is geometrically distinct from every other circle already added.
     */
    public addCircle = (circle: Circle, guaranteedNew: boolean = false) => {
        this._staleRegions = true;

        if (this._circles.includes(circle)) {
            throw new Error(`Duplicate circle: same instance C(${circle.center.x}, ${circle.center.y})R${circle.radius}`);
        }

        if (!guaranteedNew && this._circles.some(existingCircle => existingCircle.equals(circle))) {
            throw new Error(`Duplicate circle: new instance C(${circle.center.x}, ${circle.center.y})R${circle.radius}`);
        }

        circle.setStale();
        circle.onGeometryChange = () => this.onCircleChange();
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
        circle.onGeometryChange = undefined;
        this._circles = this._circles.filter(c => c !== circle);
        this._deletedCircles.push(circle);
        this._staleRegions = true;
    }

    /**
     * Check if the regions need recomputing. Requires no computation.
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
    public computeRegions(): ArcPolygon[] {
        if (!this._staleRegions) {
            return this._regions;
        }

        try {
            this.recomputeRegions();
        } catch(e) {
            if (this._debugMode === ERegionDebugMode.none) {
                throw new RegionError(
                    "An error has occurred while processing regions. You're running in debugMode=none, so no static/dynamic tests have been performed.",
                    e as Error,
                    this.circles,
                    undefined
                );
            }

            const debugData = DebugEngine.checkStatic(this.circles);

            if (debugData.numericReproducible) {
                const possiblyNotReproducible = debugData.stringReproducible ? "" : " (rounding challenge)";
                throw new RegionError(
                    "A statically reproducible error has occurred while processing regions" + possiblyNotReproducible + ". Please submit a bug report including all information in this message.",
                    e as Error,
                    debugData.circles,
                    true
                );
            }

            const currentCircles = this.dumpDynamicCircles(this._circles);
            
            throw new RegionError(
                "A statically unreproducible error has occurred while processing regions. Please submit a bug report including all information in this message. " +
                    this.circlesToString(this._lastCircles) + ", " + this.circlesToString(currentCircles),
                e as Error,
                this._circles,
                false
            );
        }

        this._lastCircles = this.dumpDynamicCircles(this._circles);

        return this._regions;
    }

    private dumpDynamicCircles = (circles: Circle[]): {x: number, y: number, r: number, iId: number}[] => {
        return circles.map(circle => ({
            x: circle.center.x,
            y: circle.center.y,
            r: circle.radius,
            iId: circle.internalId
        }));
    }

    private circlesToString = (circles: {x: number, y: number, r: number, iId: number}[]): string => {
        return JSON.stringify(circles.map(circle => ([circle.x, circle.y, circle.r, circle.iId])));
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