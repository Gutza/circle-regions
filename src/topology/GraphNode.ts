import { IGraphEnd, IPoint, ITangencyGroup, TIntersectionType, TTangencyParity, TTangencyType } from "../Types";
import { Circle } from "../geometry/Circle";
import GraphEdge from "./GraphEdge";
import { normalizeAngle } from '../geometry/utils/angles';

export default class GraphNode {
    private _tangencyGroups: ITangencyGroup[];
    private _coordinates: IPoint;
    private _edges: GraphEdge[] = [];

    constructor(coordinates: IPoint) {
        this._coordinates = coordinates;
        this._tangencyGroups = [];
    }

    public addCirclePair(circle1: Circle, circle2: Circle, intersectionType: TIntersectionType) {
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

        if (intersectionType == "lens") {
            if (tanGroups.length == 1) {
                let circle = tanGroupsCircle1.length == 0 ? circle1 : circle2;
                const tanGroup: ITangencyGroup = [ {
                    circle: circle,
                    parity: "chaos",
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

        if (tgElem1[0].parity == "chaos" || tgElem2[0].parity == "chaos") {
            if (tgElem1[0].parity == "chaos" && tgElem2[0].parity == "chaos") {
                tgElem1[0].parity = "yin";
            }

            let knownElement = tgElem1[0].parity == "chaos" ? tgElem2[0] : tgElem1[0];
            let chaoticElement = tgElem1[0].parity == "chaos" ? tgElem1[0] : tgElem2[0];
            chaoticElement.parity = this.otherParity(knownElement.parity, intersectionType);
            return;
        }
    }

    public otherParity(knownParity: TTangencyParity, tangencyType: TTangencyType): TTangencyParity {
        if (knownParity == "chaos") {
            throw new Error("The known parity can't be chaos!");
        }

        if (knownParity == "yin") {
            if (tangencyType == "innerTangent") {
                return "yin";
            } else {
                return "yang";
            }
        }

        if (tangencyType == "innerTangent") {
            return "yang";
        } else {
            return "yin";
        }
    }

    private _addTangentCircle(newCircle: Circle, existingCircle: Circle, tangencyType: TTangencyType, existingGroup: ITangencyGroup): void {
        const tgExistingElements = existingGroup.filter(tgElem => tgElem.circle === existingCircle);
        if (tgExistingElements.length !== 1) {
            throw new Error("Existing tangency element count is " + tgExistingElements.length);
        }
        const tgElem = tgExistingElements[0];
        if (tgElem.parity == "chaos") {
            tgElem.parity = "yin";
        }

        existingGroup.push({
            circle: newCircle,
            parity: this.otherParity(tgElem.parity, tangencyType),
        });
    }

    private _addNewCirclePair(circle1: Circle, circle2: Circle, intersectionType: TIntersectionType): void {
        // Easy case: just create new tangency group(s)
        if (intersectionType == "lens") {
            const tanGroup1: ITangencyGroup = [ {
                circle: circle1,
                parity: "chaos",
            } ]
            this._tangencyGroups.push(tanGroup1);

            const tanGroup2: ITangencyGroup = [ {
                circle: circle2,
                parity: "chaos",
            } ]
            this._tangencyGroups.push(tanGroup2);
            return;
        }
        
        let
            parity1: TTangencyParity,
            parity2: TTangencyParity;

        if (intersectionType == "innerTangent") {
            parity1 = parity2 = "yin";
        } else if (intersectionType == "outerTangent") {
            parity1 = "yin";
            parity2 = "yang";
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

    public removeCircle(circle: Circle): boolean {
        // First, remove the elements which contain the given circle from all tangency groups
        this._tangencyGroups.forEach(tanGroup => {
            tanGroup = tanGroup.filter(tgElement => tgElement.circle !== circle);
        });

        // Next, remove the empty tangency groups
        let prevLen = this._tangencyGroups.length;
        this._tangencyGroups = this._tangencyGroups.filter(tanGroup => tanGroup.length > 0);
        return prevLen != this.tangencyGroups.length;
    }

    public isValid(): boolean {
        return this._tangencyGroups.length > 1;
    }

    public get tangencyGroups(): ITangencyGroup[] {
        return this._tangencyGroups;
    }

    public getOtherEnd = (edge: GraphEdge): IGraphEnd => {
        return this === edge.node1 ? {
            node: edge.node2,
            direction: "forward",
        } : {
            node: edge.node1,
            direction: "backward",
        };
    }

    public getNextEdge = (edge: GraphEdge): GraphEdge | undefined => {
        const refAngle = normalizeAngle(this.getPerpendicular(edge, Math.PI));
        const tanGroups = this._tangencyGroups.filter(tg => tg.some(tge => tge.circle === edge.circle));
        if (tanGroups.length !== 1) {
            throw new Error("Edge circle not found in " + tanGroups.length + " tangency groups!");
        }
        const tgElems = tanGroups[0].filter(tge => tge.circle === edge.circle);
        if (tgElems.length !== 1) {
            throw new Error("Edge circle found in " + tgElems.length + " tangency elements!");
        }
        if (tgElems[0].parity !== "chaos") {
            throw new Error("Tangent regions not supported yet");
        }

        let minPerpendicularAngle = Number.MAX_VALUE;
        let nextEdge: GraphEdge | undefined = undefined;

        this._edges.forEach(nodeEdge => {
            if (nodeEdge === edge || nodeEdge.circle === edge.circle) {
                return;
            }
            const perpendicularAngle = this.getPerpendicular(nodeEdge, refAngle);
            if (perpendicularAngle > minPerpendicularAngle) {
                return;
            }

            minPerpendicularAngle = perpendicularAngle;
            nextEdge = nodeEdge;
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
