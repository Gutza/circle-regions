import { IGraphEnd, INextTangentEdge, TIntersectionType, ETangencyParity, ETangencyType, ETraversalDirection, EIntersectionType } from "../Types";
import { Circle } from "../geometry/Circle";
import GraphEdge from "./GraphEdge";
import { normalizeAngle } from '../geometry/utils/angles';
import { Point } from "..";
import { TangencyElement, TangencyGroup, TanGroupCollection } from "./TanGroupCollection";
import { xor } from "../geometry/utils/xor";

export default class GraphNode {
    public touched: boolean = true;
    private _tangencyCollection: TanGroupCollection = new TanGroupCollection();
    private _coordinates: Point;
    private _edges: Map<string, GraphEdge> = new Map();

    constructor(coordinates: Point) {
        this._coordinates = coordinates;
    }

    public addCirclePair(circle1: Circle, circle2: Circle, intersectionType: TIntersectionType) {
        if (!this.touched) {
            // TODO: Shouldn't we also reset the tangency collection at this point?
            // TODO: Also, is this safe? We essentially remove edges, but only from nodes!
            this._edges = new Map();
            this.touched = true;
        }

        const tanGroup1 = this._tangencyCollection.getGroupByCircle(circle1);
        const tanGroup2 = this._tangencyCollection.getGroupByCircle(circle2);
        
        if (tanGroup1 === undefined && tanGroup2 === undefined) {
            return this._addNewCirclePair(circle1, circle2, intersectionType);
        }

        // From now on, at least one tangency group is already defined.

        if (intersectionType === EIntersectionType.lens) {
            if (tanGroup1 === undefined) {
                this._tangencyCollection.addSimpleGroup(circle1);
            }
            if (tanGroup2 === undefined) {
                this._tangencyCollection.addSimpleGroup(circle2);
            }
            // If both are defined, just do nothing -- both are already defined.
            return;
        }

        if (tanGroup1 === undefined) {
            // Although the TS parser doesn't get this, if tanGroup1 is not defined, tanGroup2 must be (see above)
            return this._addTangentCircle(circle1, circle2, intersectionType, tanGroup2 as TangencyGroup);
        }

        if (tanGroup2 === undefined) {
            // No need to cast this time.
            return this._addTangentCircle(circle2, circle1, intersectionType, tanGroup1);
        }

        // Both circles are already present in tangency groups, but we might still need to retrofit their parities.
        const tgElem1 = tanGroup1.elements.get(circle1.internalId);
        if (tgElem1 === undefined) {
            throw new Error("Failed finding element in group!");
        }

        const tgElem2 = tanGroup2.elements.get(circle2.internalId);
        if (tgElem2 === undefined) {
            throw new Error("Failed finding element in group!");
        }

        if (tgElem1.parity === ETangencyParity.chaos || tgElem2.parity === ETangencyParity.chaos) {
            /*
            Both circles have tangency groups, and at least one of them is chaotic -- but now it turns
            out they should actually live in the same tangency group. We have to remove (one of) the
            chaotic tangency groups, and move that circle in the same tangency group as the other one.

            The "known element" is the tangency element which already has a non-chaotic parity. If
            both are chaotic, we just randomly assign a parity to one of them and conventionally
            declare that's now known.
            */
            let knownElement = tgElem1;
            let chaoticElement = tgElem2;
            let knownGroup = tanGroup1;
            let chaoticGroup = tanGroup2;

            if (tgElem1.parity === ETangencyParity.chaos && tgElem2.parity === ETangencyParity.chaos) {
                tgElem1.parity = ETangencyParity.yin;
            } else if (tgElem1.parity === ETangencyParity.chaos) {
                knownElement = tgElem2;
                chaoticElement = tgElem1;
                knownGroup = tanGroup2;
                chaoticGroup = tanGroup1;
            }

            // Change the parity of the chaotic element, remove it from its old group, and add it to its new group.
            // We don't need to remove the empty groups, because we're not leaving any laying around.
            chaoticElement.parity = GraphNode._otherParity(knownElement.parity, intersectionType);
            knownGroup.elements.set(chaoticElement.circle.internalId, chaoticElement);
            this._tangencyCollection.tangencyGroups = this._tangencyCollection.tangencyGroups.filter(tgrp => tgrp !== chaoticGroup);
            return;
        }

        // Both circles are already properly 
        if (
            (intersectionType === ETangencyType.innerTangent && tgElem1.parity !== tgElem2.parity) ||
            (intersectionType === ETangencyType.outerTangent && tgElem1.parity === tgElem2.parity)
        ) {
            throw new Error("Extra! Extra! Read all about it! These circles break Euclidean geometry!");
        }
    }

    private static _otherParity(knownParity: ETangencyParity, tangencyType: ETangencyType): ETangencyParity {
        return xor(
            knownParity === ETangencyParity.yin,
            tangencyType === ETangencyType.outerTangent
        ) ? ETangencyParity.yin : ETangencyParity.yang;
    }

    private _addTangentCircle(newCircle: Circle, existingCircle: Circle, tangencyType: ETangencyType, existingGroup: TangencyGroup): void {
        const tgElem = existingGroup.elements.get(existingCircle.internalId);
        if (tgElem === undefined) {
            throw new Error("Failed finding element in group!");
        }
        if (tgElem.parity === ETangencyParity.chaos) {
            tgElem.parity = ETangencyParity.yin;
        }

        existingGroup.addElement(newCircle, GraphNode._otherParity(tgElem.parity, tangencyType));
    }

    private _addNewCirclePair(circle1: Circle, circle2: Circle, intersectionType: TIntersectionType): void {
        // Easy case: just create new tangency group(s)
        if (intersectionType === EIntersectionType.lens) {
            this._tangencyCollection.addSimpleGroup(circle1);
            this._tangencyCollection.addSimpleGroup(circle2);
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

        const tanGroup = new TangencyGroup();
        tanGroup.addElement(circle1, parity1);
        tanGroup.addElement(circle2, parity2);
        this._tangencyCollection.tangencyGroups.push(tanGroup);        
    }

    public addEdge = (edge: GraphEdge): void => {
        this._edges.set(edge.id, edge);
    }

    public removeEdge = (edge: GraphEdge): void => {
        this._edges.delete(edge.id);
    }

    public get coordinates(): Point {
        return this._coordinates;
    }

    public removeCircles(circles: Circle[]): boolean {
        // First, remove the elements which contain the given circles from all tangency groups
        circles.forEach(circle => this._tangencyCollection.removeCircle(circle));
        this._edges.forEach((edge, edgeId) => {
            if (circles.includes(edge.circle)) {
                this._edges.delete(edgeId);
            }
        });
        
        // Next, remove the empty tangency groups
        return this._tangencyCollection.removeEmptyGroups();
    }

    public isValid(): boolean {
        return 1 < this._tangencyCollection.tangencyGroups.reduce<number>((prevCount, tanGroup): number => prevCount + tanGroup.elements.size, 0);
    }

    public get tangencyCollection(): TanGroupCollection {
        return this._tangencyCollection;
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

    private _getNextTangentEdge = (currentEdge: GraphEdge, currentDirection: ETraversalDirection, edgeTanGroup: TangencyGroup, edgeTanElem: TangencyElement): INextTangentEdge | undefined => {
        /**
         * All circles in a tangency group share the same incidence angle, and
         * elements with the same parity are less divergent than elements with opposite parities.
         */
        // Descending order
        // This could be optimized by inserting into a BST from the start;
        // see for instance https://github.com/gwtw/js-avl-tree/blob/master/src/avl-tree.js
        const unsortedSameSideNeighbors: TangencyElement[] = [];
        edgeTanGroup.elements.forEach(tanElem => {
            if (tanElem === edgeTanElem || tanElem.parity !== edgeTanElem.parity) {
                return;
            }
            unsortedSameSideNeighbors.push(tanElem);
        });
        
        if (unsortedSameSideNeighbors.length > 0) {
            const sameSideNeighbors = unsortedSameSideNeighbors.sort((a, b) => b.circle.radius - a.circle.radius);
            let winningTangencyElement: TangencyElement | undefined = undefined;
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
                const winningEdges: GraphEdge[] = [];
                this._edges.forEach(edge => {
                    if (edge.circle === winningTangencyElement?.circle && this === getSameEdgeEnd(edge)) {
                        winningEdges.push(edge);
                    }
                });
                if (winningEdges.length !== 1) {
                    throw new Error("Inner tangent edge found " + winningEdges.length + " times!");
                }

                return {
                    edge: winningEdges[0],
                    sameSide: true,
                };
            }
        }

        // No luck on the same side; look for an outer region by picking the largest
        // circle on the opposite side -- but only if we're traversing backwards
        // (when we traverse forwards we're only looking for inner regions)
        if (currentDirection === ETraversalDirection.forward) {
            return undefined;
        }
        const oppositeParity: ETangencyParity = edgeTanElem.parity === ETangencyParity.yin ? ETangencyParity.yang : ETangencyParity.yin;

        // Descending order
        const unsortedOppositeSideNeighbors: TangencyElement[] = [];
        edgeTanGroup.elements.forEach(tanElem => {
            if (tanElem === edgeTanElem || tanElem.parity !== oppositeParity) {
                return;
            }
            unsortedOppositeSideNeighbors.push(tanElem);
        });

        if (unsortedOppositeSideNeighbors.length === 0) {
            return undefined;
        }

        const oppositeSideNeighbors = unsortedOppositeSideNeighbors.sort((a, b) => b.circle.radius - a.circle.radius);
        const winningEdges: GraphEdge[] = [];
        this._edges.forEach(edge => {
            if (this === edge.node2 && edge.circle === oppositeSideNeighbors[0].circle) {
                winningEdges.push(edge);
            }
        });
        if (winningEdges.length !== 1) {
            throw new Error("Outer tangent edge found " + winningEdges.length + " times!");
        }

        return {
            edge: winningEdges[0],
            sameSide: false,
        };
    }

    public getNextEdge = (currentEdge: GraphEdge, currentDirection: ETraversalDirection): INextTangentEdge | undefined => {
        const tanGroup = this._tangencyCollection.getGroupByCircle(currentEdge.circle);
        if (tanGroup === undefined) {
            throw new Error("Edge circle not found in any tangency group!");
        }

        const tgElem = tanGroup.elements.get(currentEdge.circle.internalId);
        if (tgElem === undefined) {
            throw new Error("Edge circle not found in the tangency element!");
        }

        let isTangencyContour = false;
        if (tgElem.parity !== ETangencyParity.chaos) {
            const nextTangentEdge = this._getNextTangentEdge(currentEdge, currentDirection, tanGroup, tgElem);
            if (nextTangentEdge !== undefined) {
                return nextTangentEdge;
            }
            isTangencyContour = true;
        }

        let minPerpendicularAngle = Number.MAX_VALUE;
        let nextEdge: INextTangentEdge | undefined = undefined;

        const refAngle = normalizeAngle(this.getPerpendicular(currentEdge, Math.PI));

        this._tangencyCollection.tangencyGroups.forEach(tg => {
            if (tg === tanGroup) {
                // Typically, this either only contains the current edge's circle (if chaos),
                // or it was already processed in _getNextTangentEdge() (if real tangency group).
                // However, there is one last exceptional case; see the final if() after this forEach().
                return;
            }

            let allChaotic = true;
            for (const tgElem of tg.elements.values()) {
                if (tgElem.parity === ETangencyParity.chaos) {
                    continue;
                }
                allChaotic = false;
                break;
            }
            if (allChaotic) {
                if (tg.elements.size !== 1) {
                    throw new Error("Tangency group with " + tg.elements.size + " elements, all of which are chaos!");
                }

                // Easy case: just a regular intersection
                this._edges.forEach(tgEdge => {
                    if (!tg.elements.has(tgEdge.circle.internalId)) {
                        return;
                    }

                    const perpendicularAngle = this.getPerpendicular(tgEdge, refAngle);
                    if (perpendicularAngle > minPerpendicularAngle) {
                        return;
                    }
    
                    minPerpendicularAngle = perpendicularAngle;
                    nextEdge = {
                        edge: tgEdge,
                        sameSide: true,
                    };
                });

                return nextEdge;
            }

            // TODO: is it worth optimizing this with BST or similar?
            let candidates: Circle[] = [];
            const unsortedYinCircles: Circle[] = [];
            const unsortedYangCircles: Circle[] = [];
            tg.elements.forEach(tgElem => {
                if (tgElem.parity === ETangencyParity.yin) {
                    unsortedYinCircles.push(tgElem.circle);
                    return;
                }
                if (tgElem.parity === ETangencyParity.yang) {
                    unsortedYangCircles.push(tgElem.circle);
                    return;
                }
            });
            const smallestYinCircles = unsortedYinCircles.sort((a, b) => a.radius - b.radius);
            if (smallestYinCircles.length > 0) {
                candidates.push(smallestYinCircles[0]);
            }
            const smallestYangCircles = unsortedYangCircles.sort((a, b) => a.radius - b.radius);
            if (smallestYangCircles.length > 0) {
                candidates.push(smallestYangCircles[0]);
            }

            this._edges.forEach(candidateEdge => {
                if (this !== candidateEdge.node1 || !candidates.includes(candidateEdge.circle)) {
                    return;
                }

                const perpendicularAngle = this.getPerpendicular(candidateEdge, refAngle);
                if (perpendicularAngle > minPerpendicularAngle) {
                    return;
                }

                minPerpendicularAngle = perpendicularAngle;
                nextEdge = { 
                    edge: candidateEdge,
                    sameSide: true,
                };
            });

            if (nextEdge !== undefined) {
                return;
            }

            candidates = [];
            if (smallestYinCircles.length > 0) {
                candidates.push(smallestYinCircles[smallestYinCircles.length-1]);
            }
            if (smallestYangCircles.length > 0) {
                candidates.push(smallestYangCircles[smallestYangCircles.length-1]);
            }

            this._edges.forEach(candidateEdge => {
                if (this !== candidateEdge.node2 || !candidates.includes(candidateEdge.circle)) {
                    return;
                }
                const perpendicularAngle = this.getPerpendicular(candidateEdge, refAngle);
                if (perpendicularAngle > minPerpendicularAngle) {
                    return;
                }

                minPerpendicularAngle = perpendicularAngle;
                nextEdge = { 
                    edge: candidateEdge,
                    sameSide: true,
                };
            });
        });

        if (nextEdge !== undefined) {
            return nextEdge;
        }

        // One last fallback before giving up: we're allowed to continue to the next edge
        // on the same circle, past the tangency point with another circle, if and only if
        // there exists a different interior edge which belongs to this circle.
        // Depending on whether we're traversing the circle forward or backward,
        // the next edge on this circle meets the current edge at node1 (if backward)
        // or at node2 (if forward).
        if (
            nextEdge === undefined &&
            currentEdge.circle.vertices.length > 1
        ) {
            // There's a reasonable expectation these are exceptional cases, so it's probably
            // not worth caching the next edge on the same circle after every vertex;
            // instead, we're going to extract it from the data we already have.

            const endNode = (currentDirection === ETraversalDirection.forward) ? currentEdge.node2 : currentEdge.node1;
            endNode._edges.forEach(nextEdgeCandidate => {
                if (nextEdge !== undefined || nextEdgeCandidate === currentEdge || nextEdgeCandidate.circle !== currentEdge.circle) {
                    return;
                }
                nextEdge = {
                    edge: nextEdgeCandidate,
                    sameSide: true
                };
            });

            if (nextEdge !== undefined) {
                return nextEdge;
            }
            throw new Error("Multiple vertex circle with a single edge");
        }

        if (isTangencyContour) {
            const thisCircle = currentEdge.circle;
            if (currentDirection === ETraversalDirection.backward) {
                thisCircle.isExposed = true;
            } else {
                thisCircle.isExposed = true;
            }
        }
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
