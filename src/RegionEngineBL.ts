import { Circle, Point } from ".";
import { ArcPolygon } from "./geometry/ArcPolygon";
import { CircleArc } from "./geometry/CircleArc";
import CircleVertex from "./geometry/CircleVertex";
import { HALF_PI, TWO_PI } from "./geometry/utils/angles";
import { round } from "./geometry/utils/numbers";
import { xor } from "./geometry/utils/xor";
import GraphEdge from "./topology/GraphEdge";
import GraphNode from "./topology/GraphNode";

import {
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
    protected _edges: Map<string, GraphEdge> = new Map();
    protected _circles: Circle[] = [];
    protected _regions: ArcPolygon[] = [];

    /**
     * True if the regions need to be recomputed, false if they're still current.
     */
    protected _staleRegions: boolean = false;
    protected _debugMode: ERegionDebugMode;
    protected _lastCircles: {x: number, y: number, r: number, iId: number}[] = [];

    public onRegionChange: FOnDrawableEvent | undefined;
    protected _deletedCircles: Circle[] = [];

    constructor(debugMode: ERegionDebugMode) {
        this._debugMode = debugMode;
    }

    protected recomputeRegions = () => {
        //  (1/5)
        this.removeStaleNodesVertices();
        
        // (2/5)
        this.computeIntersections();

        // (3/5)
        this.rebuildStaleEdges();

        // (4/5)
        const cycles = this.extractGraphCycles();

        // (5/5)
        this.refreshRegions(cycles);

        this._staleRegions = false;

        // TODO: This is just sanity check; it can be removed when the code is mature enough.
        if (this._regions.some(r => r.regionType == ERegionType.outerContour)) {
            return;
        }

        throw new Error("This region set has no outer contours!");
    }

    protected onCircleChange = () => {
        this._staleRegions = true;
    }

    protected addNode = (circle1: Circle, circle2: Circle, intersectionPoint: Point, intersectionType: TIntersectionType): void => {
        circle1.setStale();
        circle2.setStale();

        let sameCoordinates = this._nodes.find(n => n.coordinates.equals(intersectionPoint));

        if (sameCoordinates !== undefined) {
            sameCoordinates.addCirclePair(circle1, circle2, intersectionType);
            return;
        }
        
        const newNode = new GraphNode(intersectionPoint);
        newNode.addCirclePair(circle1, circle2, intersectionType);
        this._nodes.push(newNode);
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
    
    protected removeStaleRegions = (staleCircles: Circle[]): void => {
        this._regions = this._regions.filter(region => {
            if (region.arcs.every(arc => !staleCircles.includes(arc.circle))) {
                return true;
            }

            this.emit(EDrawableEventType.delete, region);
            return false;
        });
    }

    // (1/5)
    protected removeStaleNodesVertices = (): void => {
        const staleCircles = this._circles.filter(circle => circle.isStale).concat(this._deletedCircles);

        this._circles.forEach(circle => {
            if (staleCircles.includes(circle)) {
                circle.parents = [];
                circle.children = [];
                return;
            }
            circle.children = circle.children.filter(child => !staleCircles.includes(child));
            circle.parents = circle.children.filter(parent => !staleCircles.includes(parent));
        });

        // TODO: Revisit the BL below, it looks rather sketchy (probably patched several times).

        let remainingNodes: GraphNode[] = [];
        this._nodes.forEach(node => {
            node.touched = false;
            let isNodeFresh = true;
            for (var circleIndex = 0; circleIndex < staleCircles.length; circleIndex++) {
                if (node.tangencyCollection.getGroupByCircle(staleCircles[circleIndex]) === undefined) {
                    continue;
                }

                isNodeFresh = false;
                node.removeCircles(staleCircles);
                break;
            }

            if (isNodeFresh) {
                remainingNodes.push(node);
            } else {
                // Unfortunately we have to iterate over the circles again because we
                // need a complete iteration above to determine if the node is fresh.
                this._circles.forEach(circle => {
                    circle.removeVertexByNode(node);
                });
            }
        });
        this._nodes = remainingNodes;
        
        // Remove nodes which only contain one circle
        remainingNodes = [];
        this._nodes.forEach(node => {
            if (1 >= node.tangencyCollection.tangencyGroups.reduce<number>((prevV, tanGroup) => prevV + tanGroup.elements.size, 0)) {
                node.tangencyCollection.tangencyGroups.forEach(tg => {
                    tg.elements.forEach(tge => {
                        tge.circle.removeVertexByNode(node);
                    })
                })
                return;
            }
            remainingNodes.push(node);
        });
        this._nodes = remainingNodes;

        // Let's also delete the edges and regions involving the deleted circles,
        // so we can reset the deletedCircles array ASAP and get it out of the way.
        if (this._deletedCircles.length > 0) {
            this.removeStaleRegions(this._deletedCircles);
            this._edges.forEach((edge, id) => {
                if (!this._deletedCircles.includes(edge.circle)) {
                    return;
                }

                this._edges.delete(id);
                this._nodes.forEach(node => node.removeEdge(edge));
            });
            this._deletedCircles = [];
        }
    }

    /**
     * (2/5)
     * This sets parents and children among circles, and creates nodes by
     * intersecting stale circles with all other circles. When an intersection
     * is found between a stale circle and a fresh circle, the fresh circle
     * gets contaminated -- its vertices need re-sorting, its edges deleted and re-created,
     * and all adjacent regions need to be revisited. Therefore it's marked as stale in addNode().
     * 
     * As such, stale child/parent, vertex and node cleanup must be performed before computing the
     * intersections, while edge and region cleanup must be done after computing them.
     * 
     * This means the set of stale circles could increase during this step, so:
     * (1) The notion of a circle being stale means different things before and after this step;
     * (2) The list of stale circles must be recomputed after this operation (do not cache it across this step).
     */
    protected computeIntersections = () => {
        for (let i = 0; i < this._circles.length-1; i++) {
            const c1 = this._circles[i];
            for (let j = i+1; j < this._circles.length; j++) {
                const c2 = this._circles[j];
                if (!c1.isStale && !c2.isStale) {
                    continue;
                }
                
                this.intersectCircles(c1, c2);
            }
        }
    }

    // (3/5)
    protected rebuildStaleEdges = () => {
        const staleCircles = this._circles.filter(circle => circle.isStale);

        this.removeStaleRegions(staleCircles);
        
        const staleEdges: GraphEdge[] = [];
        this._edges.forEach((edge, id) => {
            if (!staleCircles.includes(edge.circle)) {
                return;
            }

            staleEdges.push(edge);
            this._edges.delete(id);
            this._nodes.forEach(node => node.removeEdge(edge));
        });

        // !!freshEdge.*Cycle is correct, since null cycles in stale circles have already been deleted above.
        this._edges.forEach(freshEdge => {
            if (!!freshEdge.InnerCycle && freshEdge.InnerCycle.oEdges.some(oEdge => staleEdges.includes(oEdge.edge))) {
                freshEdge.InnerCycle = undefined;
            }

            if (!!freshEdge.OuterCycle && freshEdge.OuterCycle.oEdges.some(oEdge => staleEdges.includes(oEdge.edge))) {
                freshEdge.OuterCycle = undefined;
            }
        });

        staleCircles.forEach(staleCircle => {
            this._nodes.forEach(node => {
                if (node.tangencyCollection.getGroupByCircle(staleCircle) === undefined) {
                    return;
                }
                staleCircle.addVertex(new CircleVertex(node, staleCircle));
            });

            for (let i = 0; i < staleCircle.vertices.length; i++) {
                // This will add a single edge for circles which have a single tangency point; that's ok
                const newEdgeId = "c." + staleCircle.internalId + "/e." + i;

                const oldEdge = this._edges.get(newEdgeId);
                if (oldEdge !== undefined) {
                    oldEdge.InnerCycle = undefined;
                    oldEdge.OuterCycle = undefined;
                    continue;
                }

                const newEdge = new GraphEdge(staleCircle, staleCircle.vertices[i], staleCircle.vertices[i+1] ? staleCircle.vertices[i+1] : staleCircle.vertices[0], newEdgeId);
                this._edges.set(newEdge.id, newEdge);
                newEdge.node1.addEdge(newEdge);
                if (newEdge.node1 !== newEdge.node2) {
                    newEdge.node2.addEdge(newEdge);
                }
            }
            staleCircle.isStale = false;
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
        this._circles.forEach(circle => {
            if (circle.vertices.length === 0) {
                circle.isExposed = true;
                circle.isEmpty = true;
            }
            if (circle.isEmpty && !this._regions.includes(circle.innerRegion)) {
                this._regions.push(circle.innerRegion);
                this.emit(EDrawableEventType.add, circle.innerRegion);
            }
            if (circle.isExposed && !this._regions.includes(circle.outerContour)) {
                this._regions.push(circle.outerContour);
                this.emit(EDrawableEventType.add, circle.outerContour);
            }
        });

        cycles.forEach(cycle => {
            const arcs: CircleArc[] = [];
            let isContour = true;
            let topmostEdge: GraphEdge | undefined;
            cycle.oEdges.forEach(oEdge => {
                if (topmostEdge === undefined) {
                    topmostEdge = oEdge.edge;
                } else if (oEdge.edge.circle === topmostEdge.circle) {
                    // The topmost edge is the one with the midpoint angle closest to π/2.
                    const oEdgeDelta = Math.abs(HALF_PI - this.midAngle(oEdge.edge.vertex2.angle, oEdge.edge.vertex1.angle));
                    const topEdgeDelta = Math.abs(HALF_PI - this.midAngle(topmostEdge.vertex2.angle, topmostEdge.vertex1.angle));
                    if (oEdgeDelta < topEdgeDelta) {
                        topmostEdge = oEdge.edge;
                    }
                } else if (oEdge.edge.circle.center.roundedPoint.y > topmostEdge.circle.center.roundedPoint.y) {
                    topmostEdge = oEdge.edge;
                } else if (
                    oEdge.edge.circle.center.roundedPoint.y == topmostEdge.circle.center.roundedPoint.y &&
                    oEdge.edge.circle.vertices.length > topmostEdge.circle.vertices.length
                ) {
                    // If two distinct circles have the exact same y coordinate, choose
                    // the edge belonging to the circle with more vertices.
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
                if (topmostEdge === undefined || cycle.oEdges.length < 3 || topmostEdge.circle.vertices.length == 1) {
                    // Two-edge regions are always inner regions, and so are regions which contain a tangent circle at the top.
                    regionType = ERegionType.outerContour;
                } else {
                    // We don't need oriented edges: all edges in contours are clockwise,
                    // so the start node is always node2, tracing the circle clockwise to node1.
                    regionType = topmostEdge.node2.coordinates.x < topmostEdge.node1.coordinates.x ? ERegionType.outerContour : ERegionType.innerContour;
                }
            }
            const region = new ArcPolygon(arcs, regionType);
            this._regions.push(region);
            this.emit(EDrawableEventType.add, region);
        });
    }

    private midAngle = (startAngle: number, endAngle: number): number => {
        return (startAngle + endAngle)/2 - (startAngle < endAngle ? Math.PI : 0);
    }

    protected intersectCircles = (circle1: Circle, circle2: Circle): void => {
        if (!circle1.boundingBoxOverlap(circle2)) {
            return;
        }

        if (circle1 === circle2) {
            throw new Error("Attempting to intersect a circle with itself! (same instance)");
        }
    
        if (circle1.equals(circle2)) {
            throw new Error("Attempting to intersect a circle with an identical one! (different instance, same coordinates)");
        }
    
        // Math.sqrt(a**2 + b**2) is slightly safer than Math.hypot(a, b); try running the mocha tests with this instead:
        // const centerDist = Math.hypot(circle1.center.x - circle2.center.x, circle1.center.y - circle2.center.y);
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