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

export type TIntersectionType = "tangent" | "lens";

export interface ICircleIntersectionPoint {
    point: IPoint,
    intersectionType: TIntersectionType;
}

export interface ICircleIntersection {
    otherCircle: Circle;
    thisAngle: number;
    intersection: ICircleIntersectionPoint;
}