import { IGraphEnd, INextTangentEdge, TIntersectionType, ETangencyParity, ETangencyType, ETraversalDirection, EIntersectionType } from "../Types";
import { Circle } from "../geometry/Circle";
import GraphEdge from "./GraphEdge";
import { normalizeAngle } from '../geometry/utils/angles';
import { Point } from "..";
import { TangencyElement, TangencyGroup, TanGroupCollection } from "./TanGroupCollection";

export default class GraphNode {
    public touched: boolean = true;
    private _tangencyCollection: TanGroupCollection = new TanGroupCollection();
    private _coordinates: Point;
    private _edges: GraphEdge[] = [];

    constructor(coordinates: Point) {
        this._coordinates = coordinates;
    }

    public addCirclePair(circle1: Circle, circle2: Circle, intersectionType: TIntersectionType) {
        if (!this.touched) {
            this._edges = [];
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
            // Start by assuming this, and only change assumptions if needed
            let knownElement = tgElem1;
            let chaoticElement = tgElem2;

            if (tgElem1.parity === ETangencyParity.chaos && tgElem2.parity === ETangencyParity.chaos) {
                // If both are chaotic, just assign one, respecting the assumption above
                tgElem1.parity = ETangencyParity.yin;
            } else if (tgElem1.parity === ETangencyParity.chaos) {
                knownElement = tgElem2;
                chaoticElement = tgElem1;
            }

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

    private _addTangentCircle(newCircle: Circle, existingCircle: Circle, tangencyType: ETangencyType, existingGroup: TangencyGroup): void {
        const tgElem = existingGroup.elements.get(existingCircle.internalId);
        if (tgElem === undefined) {
            throw new Error("Failed finding element in group!");
        }
        if (tgElem.parity === ETangencyParity.chaos) {
            tgElem.parity = ETangencyParity.yin;
        }

        existingGroup.addElement(newCircle, this.otherParity(tgElem.parity, tangencyType));
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
        if (this._edges === undefined) {
            this._edges = [];
        }
        this._edges.push(edge);
    }

    public get coordinates(): Point {
        return this._coordinates;
    }

    public removeCircles(circles: Circle[]): boolean {
        // First, remove the elements which contain the given circles from all tangency groups
        circles.forEach(circle => this._tangencyCollection.removeCircle(circle));

        // Next, remove the empty tangency groups
        this._edges = this._edges.filter(edge => !circles.includes(edge.circle));
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
        edgeTanGroup.elements.forEach((tanElem, circleId) => {
            if (tanElem === edgeTanElem || tanElem.parity !== edgeTanElem.parity) {
                return;
            }
            unsortedSameSideNeighbors.push(tanElem);
        });
        const sameSideNeighbors = unsortedSameSideNeighbors.sort((a, b) => b.circle.radius - a.circle.radius);
        
        if (sameSideNeighbors.length > 0) {
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
                const winningEdges = this._edges.filter(edge => edge.circle === winningTangencyElement?.circle && this === getSameEdgeEnd(edge));
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
        // (when we traverse forwards we're looking for inner regions)
        if (currentDirection === ETraversalDirection.forward) {
            return undefined;
        }
        const oppositeParity: ETangencyParity = edgeTanElem.parity === ETangencyParity.yin ? ETangencyParity.yang : ETangencyParity.yin;

        // Descending order
        const unsortedOppositeSideNeighbors: TangencyElement[] = [];
        edgeTanGroup.elements.forEach((tanElem, circleId) => {
            if (tanElem === edgeTanElem || tanElem.parity !== oppositeParity) {
                return;
            }
            unsortedOppositeSideNeighbors.push(tanElem);
        });
        const oppositeSideNeighbors = unsortedOppositeSideNeighbors.sort((a, b) => b.circle.radius - a.circle.radius);

        if (oppositeSideNeighbors.length === 0) {
            return undefined;
        }

        const winningEdges = this._edges.filter(edge => edge.circle === oppositeSideNeighbors[0].circle && edge.node2 === this);
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
            throw new Error("Edge circle found in the tangency group!");
        }

        if (tgElem.parity !== ETangencyParity.chaos) {
            const nextTangentEdge = this._getNextTangentEdge(currentEdge, currentDirection, tanGroup, tgElem);
            if (nextTangentEdge !== undefined) {
                return nextTangentEdge;
            }
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
                const tgEdges = this._edges.filter(edge => tg.elements.has(edge.circle.internalId));

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
    
                    return;
                });

                return nextEdge;
            }

            // TODO: optimize with BST
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
                candidates.push(smallestYinCircles[smallestYinCircles.length-1]);
            }
            if (smallestYangCircles.length > 0) {
                candidates.push(smallestYangCircles[smallestYangCircles.length-1]);
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

        // One last fallback before giving up: we're allowed to continue to the next edge
        // on the same circle, past the tangency point with another circle, if and only if
        // the current region is on the interior of this circle (i.e. forward),
        // AND there exists a different interior edge which belongs to this circle.
        if (
            nextEdge === undefined &&
            currentDirection === ETraversalDirection.forward &&
            currentEdge.circle.vertices.length > 1
        ) {
            // There's a reasonable expectation these are exceptional cases, so it's probably
            // not worth caching the next edge on the same circle after every vertex;
            // instead, we're going to extract it from the data we already have.
            const nextRawEdge = currentEdge.node2.edges.find(edge => edge.circle === currentEdge.circle && edge !== currentEdge);
            if (nextRawEdge === undefined) {
                throw new Error("Multiple vertex circle with a single edge");
            }
            return {
                edge: nextRawEdge,
                sameSide: true
            };
        }
        
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

    public get edges(): GraphEdge[] {
        return this._edges;
    }
}
