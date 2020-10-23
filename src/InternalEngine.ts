import { Circle } from ".";
import CircleArc from "./geometry/CircleArc";
import CircleVertex from "./geometry/CircleVertex";
import { round } from "./geometry/utils/numbers";
import GraphEdge from "./topology/GraphEdge";
import GraphNode from "./topology/GraphNode";
import { IArcPolygon, ICircleRegions, IGraphCycle, IPoint, TIntersectionType, TTraversalDirection } from "./Types";

export class InternalEngine {
    protected _nodes: GraphNode[] = [];
    protected _edges: GraphEdge[] = [];
    protected _circles: Circle[] = [];
    protected _regions: ICircleRegions = {
        stale: true,
        circles: [],
        contours: [],
        regions: [],
    };
    protected _dirtyRegions: boolean = false;
    
    protected _recomputeRegions = () => {
        this._regions.stale = false;

        //  (1/5)
        this._removeDirtyNodesVertices();
        
        // (2/5)
        this._computeIntersections();

        // (3/5)
        this._rebuildDirtyEdges();

        // (4/5)
        const cycles = this._extractGraphCycles();

        // (5/5)
        this._refreshRegions(cycles);

        this._dirtyRegions = false;
    }

    protected _onCircleEvent = () => {
        this._dirtyRegions = true;
    }

    protected _addNode = (circle1: Circle, circle2: Circle, intersectionPoint: IPoint, intersectionType: TIntersectionType): GraphNode => {
        let sameCoordinates = this._nodes.filter(n =>
            round(n.coordinates.x) === round(intersectionPoint.x) &&
            round(n.coordinates.y) === round(intersectionPoint.y)
        );

        if (sameCoordinates.length > 1) {
            throw new Error("Unexpected condition: multiple nodes with the same coordinates!");
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

    protected _extractGraphCycle(startEdge: GraphEdge, direction: TTraversalDirection): IGraphCycle | null {
        const cycle: IGraphCycle = {
            oEdges: [],
        }
        const startEdgeEndNode = direction == "forward" ? startEdge.node2 : startEdge.node1;

        let currentEdgeEndNode = startEdgeEndNode;
        let currentEdge: GraphEdge | undefined = startEdge;
        let currentEdgeDirection = direction;

        while (true) {
            cycle.oEdges.push({
                edge: currentEdge,
                direction: currentEdgeDirection,
            });
            if (currentEdgeDirection == "forward") {
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
            console.log(currentEdge.id, "-->", nextEdge?.edge.id);

            if (nextEdge === undefined) {
                if (currentEdgeEndNode !== startEdgeEndNode) {
                    throw new Error("Unexpected condition: undefined edge after region was started!");
                }

                if (direction == "forward") {
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
                console.log("Found cycle:");
                cycle.oEdges.forEach(oEdge => {
                    console.log(oEdge.edge.id,"/", oEdge.direction);
                });
                console.log("Finished cycle");
                return cycle;
            }
        }
    }
    
    protected _removeDirtyRegions = (dirtyCircles: Circle[], regions: IArcPolygon[]): IArcPolygon[] => (
        regions.filter(region => region.arcs.every(arc => !dirtyCircles.includes(arc.circle)))
    );

    // (1/5)
    protected _removeDirtyNodesVertices = (): void => {
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
     * This is an important milestone in the process.
     * 
     * _computeIntersections() sets parents and children, and creates nodes by
     * intersecting dirty circles with all other circles. When an intersection
     * is found between a dirty circle and a clean circle, the clean circle
     * gets contaminated -- its vertices need re-sorting, its edges deleted and re-created,
     * and all adjacent regions need to be deleted and re-computed.
     * 
     * As such, dirty child/parent, vertex and node cleanup must be performed before computing the
     * intersections, while edge and region cleanup must be done after computing them.
     * 
     * This also means the set of dirty circles potentially increases in size during
     * this step, therefore:
     * (1) The notion of a circle being dirty means different things before and after this step;
     * (2) The list of dirty circles must be recomputed after this operation (do not cache it across this step).
     */
    protected _computeIntersections = () => {
        // TODO: Implement sweep line x 2
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
                
                this._intersectCircles(c1, c2);
            }
        }
    }

    // (3/5)
    protected _rebuildDirtyEdges = () => {
        let dirtyCircles = this._circles.filter(circle => circle.isDirty);

        this._regions.contours = this._removeDirtyRegions(dirtyCircles, this._regions.contours);
        this._regions.regions = this._removeDirtyRegions(dirtyCircles, this._regions.regions);
        
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
    protected _extractGraphCycles = (): IGraphCycle[] => {
        const cycles: IGraphCycle[] = [];

        this._edges.forEach(edge => {
            if (edge.InnerCycle === undefined) {
                const cycle = this._extractGraphCycle(edge, "forward");
                if (cycle !== null) {
                    cycles.push(cycle);
                }
            }
            if (edge.OuterCycle === undefined) {
                const cycle = this._extractGraphCycle(edge, "backward");
                if (cycle !== null) {
                    cycles.push(cycle);
                }
            }
        });

        return cycles;
    }

    // (5/5)
    protected _refreshRegions = (cycles: IGraphCycle[]): void => {
        this._regions.circles = this._circles.filter(circle => circle.vertices.length == 0);

        cycles.forEach(cycle => {
            const arcs: CircleArc[] = [];
            let isContour = true;
            cycle.oEdges.forEach(oEdge => {
                isContour = isContour && oEdge.direction == "backward";
                const startNode = oEdge.edge.node1;
                const endNode = oEdge.edge.node2;
                const startVertex = oEdge.edge.circle.getVertexByNode(startNode);
                const endVertex = oEdge.edge.circle.getVertexByNode(endNode);
                if (startVertex === undefined || endVertex === undefined) {
                    throw new Error("Failed finding vertex");
                }
                const startAngle = startVertex.angle;
                const endAngle = endVertex.angle;
                arcs.push(new CircleArc(
                    oEdge.edge.circle,
                    startAngle,
                    endAngle,
                    startNode.coordinates,
                    endNode.coordinates,
                    oEdge.direction == "backward",
                ));
            });
            if (isContour) {
                this._regions.contours.push({arcs: arcs});
            } else {
                this._regions.regions.push({arcs: arcs});
            }
        });
    }

    protected _intersectCircles = (circle1: Circle, circle2: Circle): void => {
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
        if (round(centerDist) > round(circle1.radius + circle2.radius)) {
            return;
        }
    
        if (round(circle1.radius) > round(centerDist + circle2.radius)) {
            circle1.children.push(circle2);
            circle2.parents.push(circle1);
            return;
        }
    
        if (round(circle2.radius) > round(centerDist + circle1.radius)) {
            circle2.children.push(circle1);
            circle1.parents.push(circle2);
            return;
        }
    
        const a = (circle1.radius**2 - circle2.radius**2 + centerDist**2) / (2 * centerDist);
        const h = Math.sqrt(circle1.radius**2 - a**2);
        const x = circle1.center.x + a * (circle2.center.x - circle1.center.x) / centerDist;
        const y = circle1.center.y + a * (circle2.center.y - circle1.center.y) / centerDist;
    
        if (round(circle1.radius + circle2.radius) == round(centerDist)) {
            const tangentPoint: IPoint = {
                x: x,
                y: y,
            };
            this._addNode(circle1, circle2, tangentPoint, "outerTangent");
            return;
        }
    
        if (round(Math.abs(circle1.radius - circle2.radius)) == round(centerDist)) {
            const tangentPoint: IPoint = {
                x: x,
                y: y,
            };
            this._addNode(circle1, circle2, tangentPoint, "innerTangent");
            return;
        }
    
        const hDistRatio = h / centerDist;
        const rx = -(circle2.center.y - circle1.center.y) * hDistRatio;
        const ry = -(circle2.center.x - circle1.center.x) * hDistRatio;
    
        const point1: IPoint = {
            x: x+rx,
            y: y-ry,
        };
        this._addNode(circle1, circle2, point1, "lens");
    
        const point2: IPoint = {
            x: x-rx,
            y: y+ry,
        }
        this._addNode(circle1, circle2, point2, "lens");
    } 
}