import Circle from "../geometry/Circle";
import CircleVertex from "../geometry/CircleVertex";
import intersectCircles from "../geometry/utils/intersectCircles";
import { round } from "../geometry/utils/numbers";
import { IPoint, TIntersectionType, TTraversalDirection } from "../Types";
import CircleEdge from "./CircleEdge";
import CircleLoop from "./CircleLoop";
import CircleNode from "./CircleNode";

export default class CircleGraph {
    private _nodes: CircleNode[];
    private _edges: CircleEdge[];
    private _circles: Circle[];

    constructor() {
        this._circles = [];
        this._nodes = [];
        this._edges = [];
    }

    public addNode(circle1: Circle, circle2: Circle, intersectionPoint: IPoint, intersectionType: TIntersectionType): CircleNode {
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
        
        const newNode = new CircleNode(intersectionPoint);
        newNode.addCirclePair(circle1, circle2, intersectionType);
        this._nodes.push(newNode);
        return newNode;
    }

    public addEdge(edge: CircleEdge) {
        this._edges.push(edge);
        edge.node1.addEdge(edge);
        edge.node2.addEdge(edge);
    }

    public addCircle = (circle: Circle) => {
        if (this._circles.includes(circle)) {
            console.warn("Circle with x="+circle.center.x+", y="+circle.center.y+", r="+circle.radius+" already exists.");
            return;
        }
        this._circles.forEach(otherCircle => {
            intersectCircles(this, circle, otherCircle);
        });
        this._circles.push(circle);
    }

    public removeCircle(circle: Circle) {
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

    public get nodes(): CircleNode[] {
        return this._nodes;
    }

    public compute() {
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
                this.addEdge(new CircleEdge(circle, circle.vertices[i].node, circle.vertices[i+1] ? circle.vertices[i+1].node : circle.vertices[0].node, i));
            }
        });

        console.log("Edge count", this._edges.length);

        const loops: CircleLoop[] = [];

        while (true) {
            let some = false;
            for (let i = 0; i < this._edges.length; i++) {
                const edge = this._edges[i];
                if (edge.RegionRight === undefined) {
                    some = true;
                    const loop = this.traceLoop(edge, "forward");
                    if (loop !== null) {
                        loops.push(loop);
                    }
                    break;
                }
                if (edge.RegionLeft === undefined) {
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

        console.log("== Finished all loops ==");
        loops.forEach((loop, loopIndex) => {
            loop.edges.forEach((edge, edgeIndex) => {
                console.log(loopIndex + "." + edgeIndex, edge.node1.coordinates.x + "," + edge.node1.coordinates.y, "-->", edge.node2.coordinates.x + "," + edge.node2.coordinates.y)
            })
        })
    }

    private traceLoop(startEdge: CircleEdge, direction: TTraversalDirection): CircleLoop | null {
        let loop: CircleLoop | null = new CircleLoop();
        loop.edges.push(startEdge);
        let startNode: CircleNode;
        if (direction == "forward") {
            startNode = startEdge.node2;
        } else {
            startNode = startEdge.node1;
        }
        let currentNode = startNode;
        let currentEdge: CircleEdge | undefined = startEdge;

        while (true) {
            if (currentEdge === undefined) {
                console.log("Undefined next edge");
                if (currentNode !== startNode) {
                    throw new Error("Unexpected condition: undefined edge after region was started!");
                }

                if (direction == "forward") {
                    startEdge.RegionRight = null;
                } else {
                    startEdge.RegionLeft = null;
                }
                return null;
            }

            if (direction == "forward") {
                currentEdge.RegionRight = loop;
            } else {
                currentEdge.RegionLeft = loop;
            }

            loop.edges.push(currentEdge);
            console.log("Node before tranversing x=", currentNode.coordinates.x, "y=", currentNode.coordinates.y);
            currentNode = currentNode.getOtherEnd(currentEdge);
            console.log("Node after tranversing x=", currentNode.coordinates.x, "y=", currentNode.coordinates.y);
            currentEdge = currentNode.getNextEdge(currentEdge);

            if (currentNode === startNode) {
                console.log("Finished loop", loop);
                return loop;
            }
        }
    }
}