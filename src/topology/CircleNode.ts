import { IPoint, TIntersectionType, TTangencyParity } from "../Types";
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
            // Easy case: just create new tangency group(s)
            if (intersectionType === "lens") {
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
            } else {
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
            }

            return;
        }

        // Difficult case: we know at least one of the circles is already present in tangency groups.
        // Retrofit the existing tangency groups, or add a new group for the missing circle.

        // TODO: We could do some more defensive checking here
        let foundCircle1 = false, foundCircle2 = false;

        tanGroups.forEach(tanGroup => {
            const tgElements = tanGroup.elements.filter(el => el.circle === circle1 || el.circle === circle2);
            if (tgElements.length < 1 || tgElements.length > 2) {
                throw new Error("Unexpected condition: " + tgElements.length + " tangency group elements contain either of the circles in an intersection pair!");
            }
    
            tgElements.forEach(tgElement => {
                if (foundCircle1 && foundCircle1) {
                    // We already found both circles, there's no need to process any further tangency groups
                    return;
                }

                let newCircle: Circle | undefined = undefined;
                if (tgElement.circle === circle1) {
                    foundCircle1 = true;
                    newCircle = circle2;
                } else if (tgElement.circle === circle2) {
                    foundCircle2 = true;
                    newCircle = circle1;
                } else {
                    throw new Error("Unexpected condition: the «matching» circle in the tangency group matches none of the intersecting circles!");
                }
    
                if (intersectionType == "lens") {
                    // Nothing interesting to do here any more
                    return;
                }

                // We found the pair circle, and it's tangent to this circle. Whatever happens, we know we're done.
                foundCircle1 = foundCircle2 = true;

                if (tgElement.parity == "chaos") {
                    // Retrofit the existing element, add a new element in this group, and we're done
                    tgElement.parity = "yin";
                    tanGroup.elements.push({
                        circle: newCircle,
                        parity: intersectionType == "innerTangent" ? "yin" : "yang",
                    });
                    return;
                }

                // Align the new circle to the existing circle, and we're done
                let newParity: TTangencyParity | undefined = undefined;
                if (intersectionType == "innerTangent") {
                    newParity = tgElement.parity;
                } else if (intersectionType == "outerTangent") {
                    if (tgElement.parity == "yin") {
                        newParity = "yang";
                    } else if (tgElement.parity == "yang") {
                        newParity = "yin";
                    } else {
                        throw new Error("Unexpected condition: expecting existing parity to be yin or yang; found " + tgElement.parity);
                    }
                } else {
                    throw new Error("Unexpected condition: expecting either inner or outer tangent intersection type, found "+ intersectionType +"!");
                }

                tanGroup.elements.push({
                    circle: newCircle,
                    parity: newParity,
                });
                return;
            });
        });

        if (foundCircle1 && foundCircle2) {
            return;
        }

        if (!foundCircle1 && !foundCircle2) {
            throw new Error("Unexpected condition: we should've found at least one of the circles, but found none!");
        }
        
        let newGroup = new TangencyGroup();
        newGroup.elements.push({
            circle: foundCircle1 ? circle2 : circle1,
            parity: "chaos",
        });
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
}
