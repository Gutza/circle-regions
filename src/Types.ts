import { Circle } from "./geometry/Circle";
import CircleArc from "./geometry/CircleArc";
import GraphEdge from "./topology/GraphEdge";
import GraphNode from "./topology/GraphNode";

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

export type TTangencyType = "innerTangent" | "outerTangent";
export type TIntersectionType = "lens" | TTangencyType;

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
export type ITangencyGroup = ITangencyElement[];

export enum ETraversalDirection {
    forward,
    backward
};

export interface IGraphEnd {
    node: GraphNode;
    direction: ETraversalDirection;
}

export interface IBoundingBox {
    minPoint: IPoint;
    maxPoint: IPoint;
}

export const onMoveEvent: symbol = Symbol('move');
export const onResizeEvent: symbol = Symbol('resize');

// No need to export
interface IOrientedEdge {
    edge: GraphEdge;
    direction: ETraversalDirection;
}

export interface IGraphCycle {
    oEdges: IOrientedEdge[];
}

export interface ICircleRegions {
    stale: boolean;
    circles: Circle[];
    contours: IArcPolygon[];
    regions: IArcPolygon[];
}

export interface IArcPolygon {
    arcs: CircleArc[];
}

export interface INextTangentEdge {
    edge: GraphEdge;
    sameSide: boolean;
}