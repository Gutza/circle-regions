import Circle from "./geometry/Circle";

export interface IPoint {
    x: number;
    y: number;
}

export interface ICircle {
    center: IPoint;
    radius: number;
}

export interface IRegion {
    area: number;
}

export type TIntersectionType = "innerTangent" | "outerTangent" | "lens";

export interface ICircleIntersectionPoint {
    point: IPoint,
    intersectionType: TIntersectionType;
}

export interface IVertex {
    otherCircle: Circle;
    thisAngle: number;
    intersection: ICircleIntersectionPoint;
}

export type TTangencyParity = "yin" | "yang" | "chaos";
export interface ITangencyElement {
    circle: Circle;
    parity: TTangencyParity;
}