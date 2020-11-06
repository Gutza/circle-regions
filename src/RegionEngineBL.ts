import { Circle, Point } from ".";
import { ArcPolygon } from "./geometry/ArcPolygon";
import CircleArc from "./geometry/CircleArc";
import CircleVertex from "./geometry/CircleVertex";
import { TWO_PI } from "./geometry/utils/angles";
import { round } from "./geometry/utils/numbers";
import GraphEdge from "./topology/GraphEdge";
import GraphNode from "./topology/GraphNode";

import {
    TCircleRegions,
    IGraphCycle,
    TIntersectionType,
    ETraversalDirection,
    ETangencyType,
    EIntersectionType,
    FOnDrawableEvent,
    ERegionType,
    EDrawableEventType,
    ERegionDebugMode
} from "./Types";

/**
 * The internal business logic of the region engine.
 */
export class RegionEngineBL {
    protected _nodes: GraphNode[] = [];
    protected _edges: GraphEdge[] = [];
    protected _circles: Circle[] = [];
    protected _regions: TCircleRegions = [];
    protected _staleRegions: boolean = true;
    protected _debugMode: ERegionDebugMode;

    public onRegionChange: FOnDrawableEvent | undefined;

    constructor(debugMode: ERegionDebugMode) {
        this._debugMode = debugMode;
    }

    protected recomputeRegions = () => {
        //  (1/5)
        this.removeDirtyNodesVertices();
        
        // (2/5)
        this.computeIntersections();

        // (3/5)
        this.rebuildDirtyEdges();

        // (4/5)
        const cycles = this.extractGraphCycles();

        // (5/5)
        this.refreshRegions(cycles);

        this._staleRegions = true;
    }

    protected onCircleChange = (circle: Circle) => {
        this._staleRegions = false;
        this.emit(EDrawableEventType.redraw, circle);
    }

    protected addNode = (circle1: Circle, circle2: Circle, intersectionPoint: Point, intersectionType: TIntersectionType): GraphNode => {
        let sameCoordinates = this._nodes.filter(n =>
            n.coordinates.roundedPoint.x === intersectionPoint.roundedPoint.x &&
            n.coordinates.roundedPoint.y === intersectionPoint.roundedPoint.y
        );

        if (sameCoordinates.length > 1) {
            throw new Error("Multiple nodes with the same coordinates!");
        }

        circle1.isDirty = true;
        circle2.isDirty = true;

        if (sameCoordinates.length == 1) {
            sameCoordinates[0].addCirclePair(circle1, circle2, intersectionType);
            return sameCoordinates[0];
        }
        
        const newNode = new GraphNode(intersectionPoint);
        newNode.addCirclePair(circle1, circle2, intersectionType);
        this._nodes.push(newNode);
        return newNode;
    }

    protected extractGraphCycle(startEdge: GraphEdge, direction: ETraversalDirection): IGraphCycle | null {
        const cycle: IGraphCycle = {
            oEdges: [],
        }
        const startEdgeEndNode = direction === ETraversalDirection.forward ? startEdge.node2 : startEdge.node1;

        let currentEdgeEndNode = startEdgeEndNode;
        let currentEdge: GraphEdge | undefined = startEdge;
        let currentEdgeDirection = direction;

        while (true) {
            cycle.oEdges.push({
                edge: currentEdge,
                direction: currentEdgeDirection,
            });
            if (currentEdgeDirection === ETraversalDirection.forward) {
                if (currentEdge.InnerCycle) {
                    throw new Error("Inner cycle already set for "+currentEdge.id+"!");
                }
                currentEdge.InnerCycle = cycle;
            } else {
                if (currentEdge.OuterCycle) {
                    throw new Error("Outer cycle already set for "+currentEdge.id+"!");
                }
                currentEdge.OuterCycle = cycle;
            }

            const nextEdge = currentEdgeEndNode.getNextEdge(currentEdge, currentEdgeDirection);

            if (nextEdge === undefined) {
                if (currentEdgeEndNode !== startEdgeEndNode) {
                    throw new Error("Undefined edge after region was started!");
                }

                if (direction === ETraversalDirection.forward) {
                    startEdge.InnerCycle = null;
                } else {
                    startEdge.OuterCycle = null;
                }
                return null;
            }

            const oEnd = currentEdgeEndNode.getOtherEnd(nextEdge, currentEdgeDirection);

            currentEdge = nextEdge.edge;
            currentEdgeEndNode = oEnd.node;
            currentEdgeDirection = oEnd.direction;

             if (currentEdge === startEdge) {
                return cycle;
            }
        }
    }
    
    protected removeDirtyRegions = (dirtyCircles: Circle[]): void => {
        this._regions = this._regions.filter(region => {
            if (region instanceof Circle) {
                return true;
            }

            if (region.arcs.every(arc => !dirtyCircles.includes(arc.circle))) {
                return true;
            }

            this.emit(EDrawableEventType.delete, region);
            return false;
        });
    };

    // (1/5)
    protected removeDirtyNodesVertices = (): void => {
        this._nodes.forEach(node => node.touched = false);
        let dirtyCircles = this._circles.filter(circle => circle.isDirty);

        this._circles.forEach(circle => {
            if (dirtyCircles.includes(circle)) {
                circle.parents = [];
                circle.children = [];
                return;
            }
            circle.children = circle.children.filter(child => !dirtyCircles.includes(child));
            circle.parents = circle.children.filter(parent => !dirtyCircles.includes(parent));
        });

        // TODO: Streamline this, we're traversing the same array three times in a row!

        // Affected nodes are all nodes which include dirty circles.
        const affectedNodes = this._nodes.filter(node => node.tangencyGroups.some(tanGroup => tanGroup.some(tge => dirtyCircles.includes(tge.circle))));

        // Remove the dirty circles from all affected nodes.
        affectedNodes.forEach(node => node.removeCircles(dirtyCircles));

        this._nodes = this._nodes.filter((node): boolean => {
            if (!affectedNodes.includes(node)) {
                return true;
            }

            // TODO: Is it worth improving this? We could clean up all circles again if the node isn't valid.

            this._circles.forEach(circle => {
                circle.removeVertexByNode(node);
            });

            return false;
        });
    }

    /**
     * (2/5)
     * This sets parents and children among circles, and creates nodes by
     * intersecting dirty circles with all other circles. When an intersection
     * is found between a dirty circle and a clean circle, the clean circle
     * gets contaminated -- its vertices need re-sorting, its edges deleted and re-created,
     * and all adjacent regions need to be revisited.
     * 
     * As such, dirty child/parent, vertex and node cleanup must be performed before computing the
     * intersections, while edge and region cleanup must be done after computing them.
     * 
     * This means the set of dirty circles could increase during this step, so:
     * (1) The notion of a circle being dirty means different things before and after this step;
     * (2) The list of dirty circles must be recomputed after this operation (do not cache it across this step).
     */
    protected computeIntersections = () => {
        for (let i = 0; i < this._circles.length-1; i++) {
            const c1 = this._circles[i];
            for (let j = i+1; j < this._circles.length; j++) {
                const c2 = this._circles[j];
                if (!c1.isDirty && !c2.isDirty) {
                    continue;
                }

                if (!c1.boundingBoxOverlap(c2)) {
                    continue;
                }
                
                this.intersectCircles(c1, c2);
            }
        }
    }

    // (3/5)
    protected rebuildDirtyEdges = () => {
        let dirtyCircles = this._circles.filter(circle => circle.isDirty);

        this.removeDirtyRegions(dirtyCircles);
        
        const dirtyEdges: GraphEdge[] = [];
        this._edges = this._edges.filter(edge => {
            if (!dirtyCircles.includes(edge.circle)) {
                return true;
            }

            dirtyEdges.push(edge);
            return false;
        });

        this._edges.forEach(cleanEdge => {
            if (!!cleanEdge.InnerCycle && cleanEdge.InnerCycle.oEdges.some(oEdge => dirtyEdges.includes(oEdge.edge))) {
                cleanEdge.InnerCycle = undefined;
            }

            if (!!cleanEdge.OuterCycle && cleanEdge.OuterCycle.oEdges.some(oEdge => dirtyEdges.includes(oEdge.edge))) {
                cleanEdge.OuterCycle = undefined;
            }
        });

        dirtyCircles.forEach(dirtyCircle => {
            const nodes = this._nodes.filter(node => node.tangencyGroups.some(tg => tg.some(tge => tge.circle == dirtyCircle)));
            nodes.forEach(node => {
                // This is safe: circle.addVertex() refuses to re-add existing vertices,
                // and new vertices pointing to a node contained in an existing vertex.
                dirtyCircle.addVertex(new CircleVertex(node, dirtyCircle));
            });
        });

        dirtyCircles.forEach(circle => {
            this._edges.forEach(edge => {
                if (edge.circle === circle) {
                    console.warn("Circle", circle.id, "still has edges in _computeLoops()!");
                }
            });
            for (let i = 0; i < circle.vertices.length; i++) {
                // This will add a single edge for circles which have a single tangency point; that's ok
                const newEdge = new GraphEdge(circle, circle.vertices[i].node, circle.vertices[i+1] ? circle.vertices[i+1].node : circle.vertices[0].node, "c." + circle.id + "/e." + i);
                let inhibitNewEdge: boolean = false;
                this._edges.forEach(edge => {
                    if (!edge.equals(newEdge)) {
                        return;
                    }

                    edge.InnerCycle = undefined;
                    edge.OuterCycle = undefined;
                });
                if (inhibitNewEdge) {
                    continue;
                }
                this._edges.push(newEdge);
                newEdge.node1.addEdge(newEdge);
                if (newEdge.node1 !== newEdge.node2) {
                    newEdge.node2.addEdge(newEdge);
                }
            }
            circle.isDirty = false;
        });
    }

    // (4/5)
    protected extractGraphCycles = (): IGraphCycle[] => {
        const cycles: IGraphCycle[] = [];

        this._edges.forEach(edge => {
            if (edge.InnerCycle === undefined) {
                const cycle = this.extractGraphCycle(edge, ETraversalDirection.forward);
                if (cycle !== null) {
                    cycles.push(cycle);
                }
            }
            if (edge.OuterCycle === undefined) {
                const cycle = this.extractGraphCycle(edge, ETraversalDirection.backward);
                if (cycle !== null) {
                    cycles.push(cycle);
                }
            }
        });

        return cycles;
    }

    // (5/5)
    protected refreshRegions = (cycles: IGraphCycle[]): void => {
        this._regions = this._regions.filter(circle => {
            if (circle instanceof ArcPolygon) {
                return true;
            }

            if (circle.vertices.length === 0) {
                return true;
            }

            this.emit(EDrawableEventType.delete, circle);
            return false;
        });

        this._circles.forEach(circle => {
            circle.isDisplayed = circle.vertices.length === 0;
            if (circle.vertices.length !== 0 || this._regions.includes(circle)) {
                return;
            }
            this._regions.push(circle);
            this.emit(EDrawableEventType.add, circle);
        });

        cycles.forEach(cycle => {
            const arcs: CircleArc[] = [];
            let isContour = true;
            let topmostEdge = cycle.oEdges[0].edge;
            cycle.oEdges.forEach(oEdge => {
                if (oEdge.edge.circle.center.y > topmostEdge.circle.center.y) {
                    topmostEdge = oEdge.edge;
                }
                const isClockwise = oEdge.direction === ETraversalDirection.backward;
                isContour = isContour && isClockwise;
                const startNode = oEdge.edge.node1;
                const endNode = oEdge.edge.node2;
                const startVertex = oEdge.edge.circle.getVertexByNode(startNode);
                const endVertex = oEdge.edge.circle.getVertexByNode(endNode);
                if (startVertex === undefined || endVertex === undefined) {
                    throw new Error("Failed finding vertex");
                }

                const finalAngles = [
                    isClockwise ? endVertex.angle : startVertex.angle,
                    isClockwise ? startVertex.angle : endVertex.angle,
                ];
                const firstSmaller = finalAngles[0] < finalAngles[1];
                if (firstSmaller === isClockwise) {
                    if (firstSmaller) {
                        finalAngles[1] -= TWO_PI;
                    } else {
                        finalAngles[0] -= TWO_PI;
                    }
                }

                arcs.push(new CircleArc(
                    oEdge.edge.circle,
                    finalAngles[0],
                    finalAngles[1],
                    isClockwise ? endNode.coordinates : startNode.coordinates,
                    isClockwise ? startNode.coordinates : endNode.coordinates,
                    isClockwise,
                ));
            });

            let regionType = ERegionType.region;
            if (isContour) {
                // We don't need oriented edges, because we know all edges are clockwise for contours
                regionType = topmostEdge.node2.coordinates.x < topmostEdge.node1.coordinates.x ? ERegionType.outerContour : ERegionType.innerContour;
            }
            const region = new ArcPolygon(arcs, regionType);
            this._regions.push(region);
            this.emit(EDrawableEventType.add, region);
        });
    }

    protected intersectCircles = (circle1: Circle, circle2: Circle): void => {
        if (circle1 === circle2) {
            console.warn("Don't intersect a circle with itself!");
            return;
        }
    
        if (circle1.equals(circle2)) {
            console.warn("Don't intersect a circle with an identical one");
            return;
        }
    
        // Math.sqrt(a**2 + b**2) is more precise than Math.hypot(a, b)
        const centerDist = Math.sqrt((circle1.center.x - circle2.center.x) ** 2 + (circle1.center.y - circle2.center.y) ** 2);
        const roundedCenterDist = round(centerDist);
        if (roundedCenterDist > round(circle1.radius + circle2.radius)) {
            return;
        }
    
        if (circle1.roundedRadius > round(centerDist + circle2.radius)) {
            circle1.children.push(circle2);
            circle2.parents.push(circle1);
            return;
        }
    
        if (circle2.roundedRadius > round(centerDist + circle1.radius)) {
            circle2.children.push(circle1);
            circle1.parents.push(circle2);
            return;
        }
    
        const a = (circle1.radius**2 - circle2.radius**2 + centerDist**2) / (2 * centerDist);
        const h = Math.sqrt(circle1.radius**2 - a**2);
        const x = circle1.center.x + a * (circle2.center.x - circle1.center.x) / centerDist;
        const y = circle1.center.y + a * (circle2.center.y - circle1.center.y) / centerDist;
    
        if (round(circle1.radius + circle2.radius) == roundedCenterDist) {
            this.addNode(circle1, circle2, new Point(x, y), ETangencyType.outerTangent);
            return;
        }
    
        if (round(Math.abs(circle1.radius - circle2.radius)) == roundedCenterDist) {
            this.addNode(circle1, circle2, new Point(x, y), ETangencyType.innerTangent);
            return;
        }
    
        const hDistRatio = h / centerDist;
        const rx = -(circle2.center.y - circle1.center.y) * hDistRatio;
        const ry = -(circle2.center.x - circle1.center.x) * hDistRatio;
    
        this.addNode(circle1, circle2, new Point(x + rx, y - ry), EIntersectionType.lens);
        this.addNode(circle1, circle2, new Point(x - rx, y + ry), EIntersectionType.lens);
    }

    protected emit: FOnDrawableEvent = (evType, entity) => {
        this.onRegionChange && this.onRegionChange(evType, entity);
    }
}