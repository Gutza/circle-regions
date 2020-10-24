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

export enum ETangencyType {
    innerTangent,
    outerTangent
};

export enum EIntersectionType {
    lens
};

export type TIntersectionType = EIntersectionType | ETangencyType;

export interface ICircleIntersectionPoint {
    point: IPoint,
    intersectionType: TIntersectionType;
}

export interface IVertex {
    otherCircle: Circle;
    thisAngle: number;
    intersection: ICircleIntersectionPoint;
}

export enum ETangencyParity {
    yin,
    yang,
    chaos
};

export interface ITangencyElement {
    circle: Circle;
    parity: ETangencyParity;
}
export type ITangencyGroup = ITangencyElement[];

export enum ETraversalDirection {
    /**
     * Trigonometric direction.
     */
    forward,

    /**
     * Clockwise direction, and also reverse the nodes when traversing.
     */
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

/**
 * Oriented edges must always be traversed in the indicated direction;
 * in addition, if the direction is backwards, the nodes at the end of
 * the edge must also be reversed before traversing.
 */
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