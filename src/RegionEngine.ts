import { Circle } from "./geometry/Circle";
import CircleArc from "./geometry/CircleArc";
import ArcPolygon from "./geometry/ArcPolygon";
import CircleVertex from "./geometry/CircleVertex";
import intersectCircles from "./geometry/utils/intersectCircles";
import { round } from "./geometry/utils/numbers";
import { CircleRegion, IPoint, TIntersectionType, TTraversalDirection } from "./Types";
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

    public addNode = (circle1: Circle, circle2: Circle, intersectionPoint: IPoint, intersectionType: TIntersectionType): GraphNode => {
        let sameCoordinates = this._nodes.filter(n =>
            round(n.coordinates.x) === round(intersectionPoint.x) &&
            round(n.coordinates.y) === round(intersectionPoint.y)
        );
        if (sameCoordinates.length > 1) {
            throw new Error("Unexpected condition: multiple nodes with the same coordinates!");
        }

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

    public addCircle = (circle: Circle) => {
        if (this._circles.includes(circle)) {
            console.warn("Circle with x="+circle.center.x+", y="+circle.center.y+", r="+circle.radius+" already exists.");
            return;
        }

        if (this._circles.some(gc => gc.equals(circle))) {
            console.warn("Another circle with x="+circle.center.x+", y="+circle.center.y+", r="+circle.radius+" already exists.");
            return;
        }

        this._circles.push(circle);
    }

    public removeCircle = (circle: Circle) => {
        this._nodes.forEach(n => n.removeCircle(circle));
        this._nodes = this._nodes.filter(n => {
            if (n.isValid()) {
                return true;
            }

            this._circles.forEach(circle => {
                circle.removeVertexByNode(n);
            });
            return false;
        }); // a valid node represents a valid intersection
        this._circles = this._circles.filter(c => c !== circle);
    }

    public get nodes(): GraphNode[] {
        return this._nodes;
    }

    private _computeLoops = (): GraphLoop[] => {
        // TODO: Sweep line
        for (let i = 0; i < this._circles.length-1; i++) {
            const c1 = this._circles[i];
            for (let j = i+1; j < this._circles.length; j++) {
                const c2 = this._circles[j];
                if (!c1.boundingBoxOverlap(c2)) {
                    continue;
                }
                intersectCircles(this, c1, c2);
            }
        }

        // TODO: Caching
        this._circles.forEach(circle => {
            const nodes = this._nodes.filter(n => n.tangencyGroups.some(tg => tg.elements.some(tge => tge.circle == circle)));
            nodes.forEach(node => {
                circle.addVertex(new CircleVertex(node, circle));
            });
        });

        this._circles.forEach(circle => {
            for (let i = 0; i < circle.vertices.length; i++) {
                // This will add a single edge for circles which have a single tangency point; that's ok
                this.addEdge(new GraphEdge(circle, circle.vertices[i].node, circle.vertices[i+1] ? circle.vertices[i+1].node : circle.vertices[0].node, i));
            }
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

    public get regions(): CircleRegion[] {
        if (this._regions !== undefined) {
            return this._regions;
        }

        const loops = this._computeLoops();
        this._regions = loops.map(loop => {
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

        this._regions = this._regions.concat(this._circles.filter(circle => circle.vertices.length == 0));

        return this._regions;
    }

    public get circles(): Circle[] {
        return this._circles;
    }
}