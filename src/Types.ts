import ArcPolygon from "./geometry/ArcPolygon";
import { Circle } from "./geometry/Circle";
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

export type TTraversalDirection = "forward" | "backward";

export interface IGraphEnd {
    node: GraphNode;
    direction: TTraversalDirection;
}

export type CircleRegion = Circle | ArcPolygon;

export interface IBoundingBox {
    minPoint: IPoint;
    maxPoint: IPoint;
}

export const onMoveEvent: symbol = Symbol('move');
export const onResizeEvent: symbol = Symbol('resize');

export interface IGraphLoop {
    oEdges: IOrientedEdge[];
}

interface IOrientedEdge {
    edge: GraphEdge;
    direction: TTraversalDirection;
}