import { Circle } from "./geometry/Circle";
import CircleArc from "./geometry/CircleArc";
import ArcPolygon from "./geometry/ArcPolygon";
import CircleVertex from "./geometry/CircleVertex";
import intersectCircles from "./geometry/utils/intersectCircles";
import { round } from "./geometry/utils/numbers";
import { CircleRegion, IGraphLoop, IPoint, onMoveEvent, onResizeEvent, TIntersectionType, TTraversalDirection } from "./Types";
import GraphEdge from "./topology/GraphEdge";
import GraphNode from "./topology/GraphNode";

export class RegionEngine {
    private _nodes: GraphNode[] = [];
    private _edges: GraphEdge[] = [];
    private _circles: Circle[] = [];
    private _regions?: CircleRegion[] = undefined;

    public addCircle = (circle: Circle) => {
        this._regions = undefined;

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
        this._resetCircleCaches(circle);
    }

    public addNode = (circle1: Circle, circle2: Circle, intersectionPoint: IPoint, intersectionType: TIntersectionType): GraphNode => {
        let sameCoordinates = this._nodes.filter(n =>
            round(n.coordinates.x) === round(intersectionPoint.x) &&
            round(n.coordinates.y) === round(intersectionPoint.y)
        );

        if (sameCoordinates.length > 1) {
            throw new Error("Unexpected condition: multiple nodes with the same coordinates!");
        }

        console.log("Touching circles", circle1.id, "and", circle2.id, "in RegionEngine.addNode()");

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
        console.log("Resetting circle caches for circle", circle.id);
        this._resetCircleCaches(circle);
    }

    private _resetCircleCaches = (circle: Circle) => {
        this._regions = undefined;
    }

    public get nodes(): GraphNode[] {
        return this._nodes;
    }

    private _traceLoop(startEdge: GraphEdge, direction: TTraversalDirection): IGraphLoop | null {
        const loop: IGraphLoop = {
            oEdges: [],
        }
        const startEdgeEndNode = direction == "forward" ? startEdge.node2 : startEdge.node1;

        let currentEdgeEndNode = startEdgeEndNode;
        let currentEdge: GraphEdge | undefined = startEdge;
        let currentEdgeDirection = direction;

        while (true) {
            loop.oEdges.push({
                edge: currentEdge,
                direction: currentEdgeDirection,
            });
            if (currentEdgeDirection == "forward") {
                if (currentEdge.RegionLeft) {
                    throw new Error("Region left already set!");
                }
                currentEdge.RegionLeft = loop;
            } else {
                if (currentEdge.RegionRight) {
                    throw new Error("Region right already set!");
                }
                currentEdge.RegionRight = loop;
            }

            currentEdge = currentEdgeEndNode.getNextEdge(currentEdge);

            if (currentEdge === undefined) {
                if (currentEdgeEndNode !== startEdgeEndNode) {
                    throw new Error("Unexpected condition: undefined edge after region was started!");
                }

                if (direction == "forward") {
                    startEdge.RegionLeft = null;
                } else {
                    startEdge.RegionRight = null;
                }
                return null;
            }

            const oEnd = currentEdgeEndNode.getOtherEnd(currentEdge);
            currentEdgeEndNode = oEnd.node;
            currentEdgeDirection = oEnd.direction;

            if (currentEdge === startEdge) {
                return loop;
            }
        }
    }
    
    // (1/5)
    private _removeDirtyNodesVertices = () => {
        let dirtyCircles = this._circles.filter(circle => circle.isDirty);
        console.log("_resetDirtyCaches on", dirtyCircles.length, "circles");

        // Affected nodes are all nodes which include dirty circles.
        const affectedNodes = this._nodes.filter(node => node.tangencyGroups.some(tanGroup => tanGroup.some(tge => dirtyCircles.includes(tge.circle))));

        // Remove the dirty circles from all affected nodes.
        affectedNodes.forEach(node => node.removeCircles(dirtyCircles));

        console.log("Node count before filtering", this._nodes.length, "(affected", affectedNodes.length, ")");
        this._nodes = this._nodes.filter((node): boolean => {
            if (!affectedNodes.includes(node)) {
                return true;
            }

            this._circles.forEach(circle => {
                circle.removeVertexByNode(node);
            });

            return node.isValid();
        });
        console.log("Node count after filtering", this._nodes.length);
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
     * As such, dirty vertex and node cleanup must be performed before computing the
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
        this._edges = this._edges.filter(edge => !dirtyCircles.includes(edge.circle));
        console.log("Adding vertices to", dirtyCircles.length, "dirty circles, out of", this._circles.length, "total");
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
                const newEdge = new GraphEdge(circle, circle.vertices[i].node, circle.vertices[i+1] ? circle.vertices[i+1].node : circle.vertices[0].node, i);
                console.log("Adding edge to circle", circle.id,"(existing", this._edges.length, "total)");
                this._edges.push(newEdge);
                newEdge.node1.addEdge(newEdge);
                newEdge.node2.addEdge(newEdge);
            }
            circle.isDirty = false;
        });
    }

    // (4/5)
    private _computeLoops = (): IGraphLoop[] => {
        const loops: IGraphLoop[] = [];

        while (true) {
            let some = false;
            for (let i = 0; i < this._edges.length; i++) {
                const edge = this._edges[i];
                if (edge.RegionLeft === undefined) {
                    some = true;
                    const loop = this._traceLoop(edge, "forward");
                    if (loop !== null) {
                        loops.push(loop);
                    }
                    break;
                }
                if (edge.RegionRight === undefined) {
                    some = true;
                    const loop = this._traceLoop(edge, "backward");
                    if (loop !== null) {
                        loops.push(loop);
                    }
                    break;
                }
            }

            if (!some) {
                break;
            }
        }

        return loops;
    }

    // (5/5)
    private _computeRegions = (loops: IGraphLoop[]): CircleRegion[] => {
        const newRegions: CircleRegion[] = loops.map(loop => {
            const arcs: CircleArc[] = [];
            // TODO: Optimize isContour, we're processing the same array twice
            let isContour = loop.oEdges.every(edge => edge.direction == "backward");
            loop.oEdges.forEach(oEdge => {
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
            return new ArcPolygon(arcs, isContour);
        });

        return newRegions.concat(this._circles.filter(circle => circle.vertices.length == 0));
    }

    public get regions(): CircleRegion[] {
        if (this._regions !== undefined) {
            console.log("Cached regions");
            return this._regions;
        }

        //  (1/5)
        this._removeDirtyNodesVertices();
        
        console.log("Edge count at region time", this._edges.length);

        // (2/5)
        this._computeIntersections();

        // (3/5)
        this._rebuildDirtyEdges();

        // (4/5)
        const loops = this._computeLoops();

        console.log("Loop count", loops.length);

        // (5/5)
        this._regions = this._computeRegions(loops);

        console.log("Computed regions");

        return this._regions;
    }

    public get circles(): Circle[] {
        return this._circles;
    }
}