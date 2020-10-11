import { Circle } from "./geometry/Circle";
import CircleArc from "./geometry/CircleArc";
import ArcPolygon from "./geometry/ArcPolygon";
import CircleVertex from "./geometry/CircleVertex";
import intersectCircles from "./geometry/utils/intersectCircles";
import { round } from "./geometry/utils/numbers";
import { CircleRegion, IPoint, onMoveEvent, onResizeEvent, TIntersectionType, TTraversalDirection } from "./Types";
import GraphEdge from "./topology/GraphEdge";
import GraphLoop from "./topology/GraphLoop";
import GraphNode from "./topology/GraphNode";

export class RegionEngine {
    private _nodes: GraphNode[] = [];
    private _edges: GraphEdge[] = [];
    private _circles: Circle[] = [];
    private _regions?: CircleRegion[] = undefined;

    constructor() {
    }

    public addCircle = (circle: Circle) => {
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

        this._regions = undefined;
    }

    public addNode = (circle1: Circle, circle2: Circle, intersectionPoint: IPoint, intersectionType: TIntersectionType): GraphNode => {
        let sameCoordinates = this._nodes.filter(n =>
            round(n.coordinates.x) === round(intersectionPoint.x) &&
            round(n.coordinates.y) === round(intersectionPoint.y)
        );

        if (sameCoordinates.length > 1) {
            throw new Error("Unexpected condition: multiple nodes with the same coordinates!");
        }
console.log("Touching circle", circle1.id, "and", circle2.id);
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

    public addEdge = (edge: GraphEdge) => {
        this._edges.push(edge);
        edge.node1.addEdge(edge);
        edge.node2.addEdge(edge);
    }

    public removeCircle = (circle: Circle) => {
        circle.removeListener(onMoveEvent, this.onCircleEvent);
        circle.removeListener(onResizeEvent, this.onCircleEvent);
        this._circles = this._circles.filter(c => c !== circle);
        this._resetCircleCaches(circle);
    }

    public onCircleEvent = (circle: Circle) => {
        this._resetCircleCaches(circle);
    }

    private _resetCircleCaches = (circle: Circle) => {
console.log("_resetCircleCaches("+circle.id+")");
        // Affected nodes are all nodes which include this circle.
        const affectedNodes = this._nodes.filter(node => node.tangencyGroups.some(tanGroup => tanGroup.some(tge => tge.circle == circle)));

        // Remove this circle from all affected nodes
        affectedNodes.forEach(node => node.removeCircle(circle));
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
console.log("Edge count before filtering", this._edges.length);
        this._edges = this._edges.filter(edge => {
            console.log("Edge circle", edge.circle.id, edge.circle !== circle ? "differs from" : "is the same as", circle.id);
            console.log("Circle", edge.circle.id, edge.circle.isDirty ? "is dirty" : "is clean");
            return (edge.circle !== circle) && !edge.circle.isDirty
        });
console.log("Edge count after filtering", this._edges.length);
        this._regions = undefined;
    }

    public get nodes(): GraphNode[] {
        return this._nodes;
    }

    private _traceLoop(startEdge: GraphEdge, direction: TTraversalDirection): GraphLoop | null {
        let loop: GraphLoop | null = new GraphLoop();
        let startEdgeEndNode: GraphNode;
        if (direction == "forward") {
            startEdgeEndNode = startEdge.node2;
        } else {
            startEdgeEndNode = startEdge.node1;
        }
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
    
    private _computeLoops = (): GraphLoop[] => {
        // TODO: Sweep line
        for (let i = 0; i < this._circles.length-1; i++) {
            const c1 = this._circles[i];
            for (let j = i+1; j < this._circles.length; j++) {
                const c2 = this._circles[j];
                console.log("computeLoops on", c1.id, "and", c2.id);
                if (!c1.isDirty && !c2.isDirty) {
                    console.log("computeLoops: both are clean");
                    continue;
                }
                if (!c1.boundingBoxOverlap(c2)) {
                    console.log("computeLoops: bboxes don't overlap");
                    continue;
                }
                intersectCircles(this, c1, c2);
            }
        }

        let dirtyCircles = this._circles.filter(circle => circle.isDirty);
        console.log("Reprocessing", dirtyCircles.length, "dirty circles, out of", this._circles.length, "total");
        dirtyCircles.forEach(circle => {
            const nodes = this._nodes.filter(node => node.tangencyGroups.some(tg => tg.some(tge => tge.circle == circle)));
            nodes.forEach(node => {
                circle.addVertex(new CircleVertex(node, circle));
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
                this.addEdge(new GraphEdge(circle, circle.vertices[i].node, circle.vertices[i+1] ? circle.vertices[i+1].node : circle.vertices[0].node, i));
            }
            circle.isDirty = false;
        });

        const loops: GraphLoop[] = [];

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

    public get regions(): CircleRegion[] {
        if (this._regions !== undefined) {
            return this._regions;
        }

        const loops = this._computeLoops();
console.log("Edge count at region time", this._edges.length);
        let newRegions: CircleRegion[] = loops.map(loop => {
            const arcs: CircleArc[] = [];
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

        newRegions = newRegions.concat(this._circles.filter(circle => circle.vertices.length == 0));

        return this._regions = newRegions;
    }

    public get circles(): Circle[] {
        return this._circles;
    }
}