import { Circle } from "./geometry/Circle";
import CircleArc from "./geometry/CircleArc";
import CircleVertex from "./geometry/CircleVertex";
import intersectCircles from "./geometry/utils/intersectCircles";
import { round } from "./geometry/utils/numbers";
import { IArcPolygon, ICircleRegions, IGraphCycle, IPoint, onMoveEvent, onResizeEvent, TIntersectionType, TTraversalDirection } from "./Types";
import GraphEdge from "./topology/GraphEdge";
import GraphNode from "./topology/GraphNode";

export class RegionEngine {
    private _nodes: GraphNode[] = [];
    private _edges: GraphEdge[] = [];
    private _circles: Circle[] = [];
    private _regions: ICircleRegions = {
        circles: [],
        contours: [],
        regions: [],
    };
    private _dirtyRegions: boolean = false;

    public addCircle = (circle: Circle) => {
        this._dirtyRegions = true;

        if (this._circles.includes(circle)) {
            console.warn("Circle with x="+circle.center.x+", y="+circle.center.y+", r="+circle.radius+" already exists.");
            return;
        }

        if (this._circles.some(gc => gc.equals(circle))) {
            console.warn("Another circle with x="+circle.center.x+", y="+circle.center.y+", r="+circle.radius+" already exists.");
            return;
        }
        circle.isDirty = true;
        circle.on(onMoveEvent, this.onCircleEvent);
        circle.on(onResizeEvent, this.onCircleEvent);
        this._circles.push(circle);
    }

    public removeCircle = (circle: Circle) => {
        circle.removeListener(onMoveEvent, this.onCircleEvent);
        circle.removeListener(onResizeEvent, this.onCircleEvent);
        this._circles = this._circles.filter(c => c !== circle);
        this._dirtyRegions = true;
    }

    public addNode = (circle1: Circle, circle2: Circle, intersectionPoint: IPoint, intersectionType: TIntersectionType): GraphNode => {
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

    public onCircleEvent = (circle: Circle) => {
        this._dirtyRegions = true;
    }

    public get nodes(): GraphNode[] {
        return this._nodes;
    }

    private _extractGraphCycle(startEdge: GraphEdge, direction: TTraversalDirection): IGraphCycle | null {
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
                if (currentEdge.LeftCycle) {
                    throw new Error("Region left already set!");
                }
                currentEdge.LeftCycle = cycle;
            } else {
                if (currentEdge.RightCycle) {
                    throw new Error("Region right already set!");
                }
                currentEdge.RightCycle = cycle;
            }

            currentEdge = currentEdgeEndNode.getNextEdge(currentEdge);

            if (currentEdge === undefined) {
                if (currentEdgeEndNode !== startEdgeEndNode) {
                    throw new Error("Unexpected condition: undefined edge after region was started!");
                }

                if (direction == "forward") {
                    startEdge.LeftCycle = null;
                } else {
                    startEdge.RightCycle = null;
                }
                return null;
            }

            const oEnd = currentEdgeEndNode.getOtherEnd(currentEdge);
            currentEdgeEndNode = oEnd.node;
            currentEdgeDirection = oEnd.direction;

            if (currentEdge === startEdge) {
                return cycle;
            }
        }
    }
    
    private _removeDirtyRegions = (dirtyCircles: Circle[], regions: IArcPolygon[]): IArcPolygon[] => (
        regions.filter(region => region.arcs.every(arc => !dirtyCircles.includes(arc.circle)))
    );

    // (1/5)
    private _removeDirtyNodesVertices = (): void => {
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

            return node.isValid();
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
    private _computeIntersections = () => {
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
                
                intersectCircles(this, c1, c2);
            }
        }
    }

    // (3/5)
    private _rebuildDirtyEdges = () => {
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
            if (!!cleanEdge.LeftCycle && cleanEdge.LeftCycle.oEdges.some(oEdge => dirtyEdges.includes(oEdge.edge))) {
                cleanEdge.LeftCycle = undefined;
            }

            if (!!cleanEdge.RightCycle && cleanEdge.RightCycle.oEdges.some(oEdge => dirtyEdges.includes(oEdge.edge))) {
                cleanEdge.RightCycle = undefined;
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
                const newEdge = new GraphEdge(circle, circle.vertices[i].node, circle.vertices[i+1] ? circle.vertices[i+1].node : circle.vertices[0].node, "c" + circle.id + "e" + i);
                this._edges.push(newEdge);
                newEdge.node1.addEdge(newEdge);
                newEdge.node2.addEdge(newEdge);
            }
            circle.isDirty = false;
        });
    }

    // (4/5)
    private _extractGraphCycles = (): IGraphCycle[] => {
        const cycles: IGraphCycle[] = [];

        while (true) {
            let some = false;

            for (let i = 0; i < this._edges.length; i++) {
                const edge = this._edges[i];
                if (edge.LeftCycle === undefined) {
                    some = true;
                    const cycle = this._extractGraphCycle(edge, "forward");
                    if (cycle !== null) {
                        cycles.push(cycle);
                    }
                    break;
                }
                if (edge.RightCycle === undefined) {
                    some = true;
                    const cycle = this._extractGraphCycle(edge, "backward");
                    if (cycle !== null) {
                        cycles.push(cycle);
                    }
                    break;
                }
            }

            if (!some) {
                break;
            }
        }

        return cycles;
    }

    // (5/5)
    private _refreshRegions = (cycles: IGraphCycle[]): void => {
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

    public get regions(): ICircleRegions {
        if (!this._dirtyRegions) {
            return this._regions;
        }

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
        return this._regions;
    }

    public get circles(): Circle[] {
        return this._circles;
    }
}