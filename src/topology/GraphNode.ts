import { IGraphEnd, INextTangentEdge, IPoint, ITangencyElement, ITangencyGroup, TIntersectionType, ETangencyParity, ETangencyType, ETraversalDirection, EIntersectionType } from "../Types";
import { Circle } from "../geometry/Circle";
import GraphEdge from "./GraphEdge";
import { normalizeAngle } from '../geometry/utils/angles';
import { round } from "../geometry/utils/numbers";

export default class GraphNode {
    public touched: boolean = true;
    private _tangencyGroups: ITangencyGroup[];
    private _coordinates: IPoint;
    private _edges: GraphEdge[] = [];

    constructor(coordinates: IPoint) {
        this._coordinates = coordinates;
        this._tangencyGroups = [];
    }

    public addCirclePair(circle1: Circle, circle2: Circle, intersectionType: TIntersectionType) {
        if (!this.touched) {
            this._edges = [];
            this.touched = true;
        }
        let tanGroups = this._tangencyGroups.filter(tanGroup => tanGroup.some(tgElement => tgElement.circle === circle1 || tgElement.circle === circle2));
        if (tanGroups.length > 2) {
            // Easiest case: just die. This should never happen with good data.
            throw new Error("Unexpected condition: more than two existing tangency groups matching for a new circle pair!");
        }

        if (tanGroups.length == 0) {
            return this._addNewCirclePair(circle1, circle2, intersectionType);
        }

        let tanGroupsCircle1 = tanGroups.filter(tanGroup => tanGroup.some(tgElement => tgElement.circle === circle1));
        if (tanGroupsCircle1.length > 1) {
            throw new Error("Unexpected condition: a circle is present in multiple tangency groups! [1]");
        }

        let tanGroupsCircle2 = tanGroups.filter(tanGroup => tanGroup.some(tgElement => tgElement.circle === circle2));
        if (tanGroupsCircle2.length > 1) {
            throw new Error("Unexpected condition: a circle is present in multiple tangency groups! [2]");
        }

        if (intersectionType === EIntersectionType.lens) {
            if (tanGroups.length == 1) {
                let circle = tanGroupsCircle1.length == 0 ? circle1 : circle2;
                const tanGroup: ITangencyGroup = [ {
                    circle: circle,
                    parity: ETangencyParity.chaos,
                } ]
                this._tangencyGroups.push(tanGroup);
            }
            return;
        }

        if (tanGroupsCircle1.length == 0) {
            return this._addTangentCircle(circle1, circle2, intersectionType, tanGroupsCircle2[0]);
        }

        if (tanGroupsCircle2.length == 0) {
            return this._addTangentCircle(circle2, circle1, intersectionType, tanGroupsCircle1[0]);
        }

        // Both circles are already here, but we might still need to retrofit the parities.
        const tgElem1 = tanGroupsCircle1[0].filter(tgElem => tgElem.circle === circle1);
        if (tgElem1.length !== 1) {
            throw new Error("Existing tangency element count is " + tgElem1.length + " [1]");
        }

        const tgElem2 = tanGroupsCircle1[0].filter(tgElem => tgElem.circle === circle2);
        if (tgElem2.length !== 1) {
            throw new Error("Existing tangency element count is " + tgElem1.length + " [2]");
        }

        if (tgElem1[0].parity === ETangencyParity.chaos || tgElem2[0].parity === ETangencyParity.chaos) {
            if (tgElem1[0].parity === ETangencyParity.chaos && tgElem2[0].parity === ETangencyParity.chaos) {
                tgElem1[0].parity = ETangencyParity.yin;
            }

            let knownElement = tgElem1[0].parity === ETangencyParity.chaos ? tgElem2[0] : tgElem1[0];
            let chaoticElement = tgElem1[0].parity === ETangencyParity.chaos ? tgElem1[0] : tgElem2[0];
            chaoticElement.parity = this.otherParity(knownElement.parity, intersectionType);
            return;
        }
    }

    public otherParity(knownParity: ETangencyParity, tangencyType: ETangencyType): ETangencyParity {
        if (knownParity === ETangencyParity.chaos) {
            throw new Error("The known parity can't be chaos!");
        }

        if (knownParity === ETangencyParity.yin) {
            if (tangencyType === ETangencyType.innerTangent) {
                return ETangencyParity.yin;
            } else {
                return ETangencyParity.yang;
            }
        }

        if (tangencyType === ETangencyType.innerTangent) {
            return ETangencyParity.yang;
        } else {
            return ETangencyParity.yin;
        }
    }

    private _addTangentCircle(newCircle: Circle, existingCircle: Circle, tangencyType: ETangencyType, existingGroup: ITangencyGroup): void {
        const tgExistingElements = existingGroup.filter(tgElem => tgElem.circle === existingCircle);
        if (tgExistingElements.length !== 1) {
            throw new Error("Existing tangency element count is " + tgExistingElements.length);
        }
        const tgElem = tgExistingElements[0];
        if (tgElem.parity === ETangencyParity.chaos) {
            tgElem.parity = ETangencyParity.yin;
        }

        existingGroup.push({
            circle: newCircle,
            parity: this.otherParity(tgElem.parity, tangencyType),
        });
    }

    private _addNewCirclePair(circle1: Circle, circle2: Circle, intersectionType: TIntersectionType): void {
        // Easy case: just create new tangency group(s)
        if (intersectionType === EIntersectionType.lens) {
            const tanGroup1: ITangencyGroup = [ {
                circle: circle1,
                parity: ETangencyParity.chaos,
            } ]
            this._tangencyGroups.push(tanGroup1);

            const tanGroup2: ITangencyGroup = [ {
                circle: circle2,
                parity: ETangencyParity.chaos,
            } ]
            this._tangencyGroups.push(tanGroup2);
            return;
        }
        
        let
            parity1: ETangencyParity,
            parity2: ETangencyParity;

        if (intersectionType === ETangencyType.innerTangent) {
            parity1 = ETangencyParity.yin;
            parity2 = ETangencyParity.yin;
        } else if (intersectionType === ETangencyType.outerTangent) {
            parity1 = ETangencyParity.yin;
            parity2 = ETangencyParity.yang;
        } else {
            throw new Error("Unknown intersection type: " + intersectionType);
        }

        const tanGroup: ITangencyGroup = [ {
            circle: circle1,
            parity: parity1,
        }, {
            circle: circle2,
            parity: parity2,
        }];
        this._tangencyGroups.push(tanGroup);        
    }

    public addEdge = (edge: GraphEdge): void => {
        if (this._edges === undefined) {
            this._edges = [];
        }
        this._edges.push(edge);
    }

    public get coordinates(): IPoint {
        return this._coordinates;
    }

    public removeCircles(circles: Circle[]): boolean {
        // First, remove the elements which contain the given circles from all tangency groups
        for (let i = 0; i < this._tangencyGroups.length; i++) {
            this._tangencyGroups[i] = this._tangencyGroups[i].filter(tgElement => !circles.includes(tgElement.circle));
        }

        // Next, remove the empty tangency groups
        let prevLen = this._tangencyGroups.length;
        this._tangencyGroups = this._tangencyGroups.filter(tanGroup => tanGroup.length > 0);
        this._edges = this._edges.filter(edge => !circles.includes(edge.circle));
        return prevLen != this.tangencyGroups.length;
    }

    public isValid(): boolean {
        return 1 < this._tangencyGroups.reduce<number>((prevCount, tanGroup): number => prevCount + tanGroup.length, 0);
    }

    public get tangencyGroups(): ITangencyGroup[] {
        return this._tangencyGroups;
    }

    public getOtherEnd = (tanEdge: INextTangentEdge, direction: ETraversalDirection): IGraphEnd => {
        if (tanEdge.edge.node1 === tanEdge.edge.node2) {
            const oldDirection: ETraversalDirection = direction === ETraversalDirection.backward ? ETraversalDirection.forward : ETraversalDirection.backward;
            const newDirection: ETraversalDirection = tanEdge.sameSide ? oldDirection : direction;
            return {
                node: tanEdge.edge.node1,
                direction: newDirection,
            };
        }

        return this === tanEdge.edge.node1 ? {
            node: tanEdge.edge.node2,
            direction: ETraversalDirection.forward,
        } : {
            node: tanEdge.edge.node1,
            direction: ETraversalDirection.backward,
        };
    }

    private _getNextTangentEdge = (currentEdge: GraphEdge, currentDirection: ETraversalDirection, edgeTanGroup: ITangencyGroup, edgeTanElem: ITangencyElement): INextTangentEdge | undefined => {
        /**
         * All circles in a tangency group share the same incidence angle, and
         * elements with the same parity are less divergent than elements with opposite parities.
         */
        // Descending order
        const sameSideNeighbors = edgeTanGroup.
            filter(tge => tge !== edgeTanElem && tge.parity === edgeTanElem.parity).
            sort((a, b) => b.circle.radius - a.circle.radius);
        
        if (sameSideNeighbors.length > 0) {
            let winningTangencyElement: ITangencyElement | undefined = undefined;
            let getSameEdgeEnd: Function;
            if (currentDirection === ETraversalDirection.forward) {
                winningTangencyElement = sameSideNeighbors.find(winningEdge => winningEdge.circle.radius < currentEdge.circle.radius);
                getSameEdgeEnd = (edge: GraphEdge): GraphNode => edge.node2;
            } else {
                winningTangencyElement = sameSideNeighbors.reverse().find(winningEdge => winningEdge.circle.radius > currentEdge.circle.radius);
                getSameEdgeEnd = (edge: GraphEdge): GraphNode => edge.node1;
            }

            if (winningTangencyElement !== undefined) {
                // Found a same side neighbor with a larger circle! Now let's find the edge.
                const winningEdges = this._edges.filter(edge => edge.circle === winningTangencyElement?.circle && this === getSameEdgeEnd(edge));
                if (winningEdges.length !== 1) {
                    throw new Error("Inner tangent edge found " + winningEdges.length + " times!");
                }

                console.log("Winning inner");
                return {
                    edge: winningEdges[0],
                    sameSide: true,
                };
            }
        }

        // No luck on the same side; look for an outer region by picking the largest
        // circle on the opposite side -- but only if we're traversing backwards
        // (when we traverse forwards we're looking for inner regions)
        if (currentDirection === ETraversalDirection.forward) {
            return undefined;
        }
        const oppositeParity: ETangencyParity = edgeTanElem.parity === ETangencyParity.yin ? ETangencyParity.yang : ETangencyParity.yin;

        // Descending order
        const oppositeSideNeighbors = edgeTanGroup.
            filter(tge => tge !== edgeTanElem && tge.parity === oppositeParity).
            sort((a, b) => b.circle.radius - a.circle.radius);

        if (oppositeSideNeighbors.length === 0) {
            return undefined;
        }

        const winningEdges = this._edges.filter(edge => edge.circle === oppositeSideNeighbors[0].circle && edge.node2 === this);
        if (winningEdges.length !== 1) {
            throw new Error("Outer tangent edge found " + winningEdges.length + " times!");
        }

        console.log("Winning outer");
        return {
            edge: winningEdges[0],
            sameSide: false,
        };
    }

    public getNextEdge = (currentEdge: GraphEdge, currentDirection: ETraversalDirection): INextTangentEdge | undefined => {
        const tanGroups = this._tangencyGroups.filter(tg => tg.some(tge => tge.circle === currentEdge.circle));
        if (tanGroups.length !== 1) {
            throw new Error("Edge circle found in " + tanGroups.length + " tangency groups!");
        }

        const tgElems = tanGroups[0].filter(tge => tge.circle === currentEdge.circle);
        if (tgElems.length !== 1) {
            throw new Error("Edge circle found in " + tgElems.length + " tangency elements!");
        }

        if (tgElems[0].parity !== ETangencyParity.chaos) {
            const nextTangentEdge = this._getNextTangentEdge(currentEdge, currentDirection, tanGroups[0], tgElems[0]);
            if (nextTangentEdge !== undefined) {
                console.log("Tangent edge", currentEdge.id, "/", currentDirection, "->", nextTangentEdge.edge.id);
                return nextTangentEdge;
            }
            console.log("Tangent edge", currentEdge.id, "/", currentDirection,"is a dead end");
        }

        let minPerpendicularAngle = Number.MAX_VALUE;
        let nextEdge: INextTangentEdge | undefined = undefined;

        const refAngle = normalizeAngle(this.getPerpendicular(currentEdge, Math.PI));

        this._tangencyGroups.forEach(tg => {
            if (tg === tanGroups[0]) {
                // This either only contains the current edge's circle (if chaos),
                // or it was already processed in _getNextTangentEdge() (if real tangency group)
                return;
            }

            if (tg.every(tge => tge.parity === ETangencyParity.chaos)) {
                if (tg.length !== 1) {
                    throw new Error("Tangency group with " + tg.length + " elements, all of which are chaos!");
                }

                // Easy case: just a regular intersection
                const tgEdges = this._edges.filter(edge => edge.circle === tg[0].circle);

                tgEdges.forEach(tgEdge => {
                    const perpendicularAngle = this.getPerpendicular(tgEdge, refAngle);
                    if (perpendicularAngle > minPerpendicularAngle) {
                        return;
                    }
    
                    minPerpendicularAngle = perpendicularAngle;
                    nextEdge = {
                        edge: tgEdge,
                        sameSide: true,
                    };
    
                    if (0 == round(minPerpendicularAngle)) {
                        console.log("Zero angle", currentEdge.circle.id, tgEdge.circle.id);
                    }
    
                    return;
                });

                return nextEdge;
            }

            console.log("TANGENCY MECHANISM");
            let candidates: Circle[] = [];
            const smallestYinCircles = tg.filter(tge => tge.parity === ETangencyParity.yin).sort((a, b) => a.circle.radius - b.circle.radius);
            if (smallestYinCircles.length > 0) {
                candidates.push(smallestYinCircles[0].circle);
            }
            const smallestYangCircles = tg.filter(tge => tge.parity === ETangencyParity.yang).sort((a, b) => a.circle.radius - b.circle.radius);
            if (smallestYangCircles.length > 0) {
                candidates.push(smallestYangCircles[0].circle);
            }

            this._edges.
                filter(candidateEdge => candidates.includes(candidateEdge.circle) && candidateEdge.node1 === this).
                forEach(candidateEdge => {
                    const perpendicularAngle = this.getPerpendicular(candidateEdge, refAngle);
                    if (perpendicularAngle > minPerpendicularAngle) {
                        return;
                    }

                    minPerpendicularAngle = perpendicularAngle;
                    nextEdge = { 
                        edge: candidateEdge,
                        sameSide: true,
                    };
                    return;
                });

            if (nextEdge !== undefined) {
                return;
            }

            candidates = [];
            if (smallestYinCircles.length > 0) {
                candidates.push(smallestYinCircles[smallestYinCircles.length-1].circle);
            }
            if (smallestYangCircles.length > 0) {
                candidates.push(smallestYangCircles[smallestYangCircles.length-1].circle);
            }

            this._edges.
                filter(candidateEdge => candidates.includes(candidateEdge.circle) && candidateEdge.node2 === this).
                forEach(candidateEdge => {
                    const perpendicularAngle = this.getPerpendicular(candidateEdge, refAngle);
                    if (perpendicularAngle > minPerpendicularAngle) {
                        return;
                    }

                    minPerpendicularAngle = perpendicularAngle;
                    nextEdge = { 
                        edge: candidateEdge,
                        sameSide: true,
                    };
                    return;
                });
        });
        
        return nextEdge;
    }

    private getPerpendicular(edge: GraphEdge, refAngle: number): number {
        // Edges are always naturally ordered trigonometrically
        const thisVertex = edge.circle.getVertexByNode(this);

        if (thisVertex === undefined) {
            throw new Error("Vertex not found on circle!");
        }

        return normalizeAngle(thisVertex.angle + (this === edge.node1 ? -1 : 1) * Math.PI / 2 - refAngle);
    }
}
