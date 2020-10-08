import { IPoint, ITangencyElement, TIntersectionType, TTangencyParity, TTangencyType } from "../Types";
import Circle from "../geometry/Circle";
import CircleEdge from "./CircleEdge";
import TangencyGroup from "./TangencyGroup";

export default class CircleNode {
    private _tangencyGroups: TangencyGroup[];
    private _coordinates: IPoint;
    private _edges?: CircleEdge[];

    constructor(coordinates: IPoint) {
        this._coordinates = coordinates;
        this._tangencyGroups = [];
    }

    public addCirclePair(circle1: Circle, circle2: Circle, intersectionType: TIntersectionType) {
        let tanGroups = this._tangencyGroups.filter(tanGroup => tanGroup.elements.some(tgElement => tgElement.circle === circle1 || tgElement.circle === circle2));
        if (tanGroups.length > 2) {
            // Easiest case: just die. This should never happen with good data.
            throw new Error("Unexpected condition: more than two existing tangency groups matching for a new circle pair!");
        }

        if (tanGroups.length == 0) {
            return this._addNewCirclePair(circle1, circle2, intersectionType);
        }

        let tanGroupsCircle1 = tanGroups.filter(tanGroup => tanGroup.elements.some(tgElement => tgElement.circle === circle1));
        if (tanGroupsCircle1.length > 1) {
            throw new Error("Unexpected condition: a circle is present in multiple tangency groups! [1]");
        }

        let tanGroupsCircle2 = tanGroups.filter(tanGroup => tanGroup.elements.some(tgElement => tgElement.circle === circle2));
        if (tanGroupsCircle2.length > 1) {
            throw new Error("Unexpected condition: a circle is present in multiple tangency groups! [2]");
        }

        if (intersectionType == "lens") {
            if (tanGroups.length == 1) {
                let circle = tanGroupsCircle1.length == 0 ? circle1 : circle2;
                const tanGroup = new TangencyGroup();
                tanGroup.elements = [ {
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
        const tgElem1 = tanGroupsCircle1[0].elements.filter(tgElem => tgElem.circle === circle1);
        if (tgElem1.length !== 1) {
            throw new Error("Existing tangency element count is " + tgElem1.length + " [1]");
        }

        const tgElem2 = tanGroupsCircle1[0].elements.filter(tgElem => tgElem.circle === circle2);
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

    private _addTangentCircle(newCircle: Circle, existingCircle: Circle, tangencyType: TTangencyType, existingGroup: TangencyGroup): void {
        const tgExistingElements = existingGroup.elements.filter(tgElem => tgElem.circle === existingCircle);
        if (tgExistingElements.length !== 1) {
            throw new Error("Existing tangency element count is " + tgExistingElements.length);
        }
        const tgElem = tgExistingElements[0];
        if (tgElem.parity == "chaos") {
            tgElem.parity = "yin";
        }

        existingGroup.elements.push({
            circle: newCircle,
            parity: this.otherParity(tgElem.parity, tangencyType),
        });
    }

    private _addNewCirclePair(circle1: Circle, circle2: Circle, intersectionType: TIntersectionType): void {
        // Easy case: just create new tangency group(s)
        if (intersectionType == "lens") {
            const tanGroup1 = new TangencyGroup();
            tanGroup1.elements = [ {
                circle: circle1,
                parity: "chaos",
            } ]
            this._tangencyGroups.push(tanGroup1);

            const tanGroup2 = new TangencyGroup();
            tanGroup2.elements = [ {
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

        const tanGroup = new TangencyGroup();
        tanGroup.elements = [{
            circle: circle1,
            parity: parity1,
        }, {
            circle: circle2,
            parity: parity2,
        }];
        this._tangencyGroups.push(tanGroup);        
    }

    public addEdge = (edge: CircleEdge): void => {
        if (this._edges === undefined) {
            this._edges = [];
        }
        this._edges.push(edge);
    }

    public get coordinates(): IPoint {
        return this._coordinates;
    }

    public removeCircle(circle: Circle) {
        // First, remove the elements which contain the given circle from all tangency groups
        this._tangencyGroups.forEach(tanGroup => {
            tanGroup.elements = tanGroup.elements.filter(tgElement => tgElement.circle !== circle);
        });

        // Next, remove the empty tangency groups
        this._tangencyGroups = this._tangencyGroups.filter(tanGroup => tanGroup.elements.length > 0);
    }

    public isValid(): boolean {
        return this._tangencyGroups.length > 1;
    }

    public get tangencyGroups(): TangencyGroup[] {
        return this._tangencyGroups;
    }
}
