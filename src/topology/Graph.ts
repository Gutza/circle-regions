import { Circle } from "../geometry/Circle";
import CircleArc from "../geometry/CircleArc";
import ArcPolygon from "../geometry/ArcPolygon";
import CircleVertex from "../geometry/CircleVertex";
import intersectCircles from "../geometry/utils/intersectCircles";
import { round } from "../geometry/utils/numbers";
import { CircleRegion, IPoint, TIntersectionType, TTraversalDirection } from "../Types";
import GraphEdge from "./GraphEdge";
import GraphLoop from "./GraphLoop";
import GraphNode from "./GraphNode";

export class Graph {
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

        if (this._circles.some(gc => (
            round(gc.center.x) == round(circle.center.x) &&
            round(gc.center.y) == round(circle.center.y) &&
            round(gc.radius) == round(circle.radius)
        ))) {
            console.warn("Another circle with x="+circle.center.x+", y="+circle.center.y+", r="+circle.radius+" already exists.");
            return;
        }

        this._circles.forEach(otherCircle => {
            intersectCircles(this, circle, otherCircle);
        });
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

    private _compute = (): GraphLoop[] => {
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

        console.log("Edge count", this._edges.length);

        const loops: GraphLoop[] = [];

        while (true) {
            let some = false;
            for (let i = 0; i < this._edges.length; i++) {
                const edge = this._edges[i];
                if (edge.RegionLeft === undefined) {
                    some = true;
                    const loop = this.traceLoop(edge, "forward");
                    if (loop !== null) {
                        loops.push(loop);
                    }
                    break;
                }
                if (edge.RegionRight === undefined) {
                    some = true;
                    const loop = this.traceLoop(edge, "backward");
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

        // Only debugging
        console.log("== Finished all loops ==");
        loops.forEach((loop, loopIndex) => {
            loop.oEdges.forEach((oEdge, edgeIndex) => {
                let startNode = oEdge.direction == "forward" ? oEdge.edge.node1 : oEdge.edge.node2;
                let endNode = oEdge.direction == "forward" ? oEdge.edge.node2 : oEdge.edge.node1;
                console.log(loopIndex + "." + edgeIndex, startNode.coordinates.x + "," + startNode.coordinates.y, "-->", endNode.coordinates.x + "," + endNode.coordinates.y)
            })
        });
        // Finished debugging

        return loops;
    }

    private traceLoop(startEdge: GraphEdge, direction: TTraversalDirection): GraphLoop | null {
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
                console.log("Undefined next edge");
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

            console.log("Node before tranversing x=", currentEdgeEndNode.coordinates.x, "y=", currentEdgeEndNode.coordinates.y);
            const oEnd = currentEdgeEndNode.getOtherEnd(currentEdge);
            currentEdgeEndNode = oEnd.node;
            currentEdgeDirection = oEnd.direction;
            console.log("Node after tranversing x=", currentEdgeEndNode.coordinates.x, "y=", currentEdgeEndNode.coordinates.y);

            if (currentEdge === startEdge) {
                console.log("Finished loop", loop);
                return loop;
            }
        }
    }

    public get regions(): CircleRegion[] {
        if (this._regions !== undefined) {
            return this._regions;
        }

        const loops = this._compute();
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
}