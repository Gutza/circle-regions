import { ArcPolygon } from "./geometry/ArcPolygon";
import { Circle } from "./geometry/Circle";
import { PureGeometry } from "./geometry/PureGeometry";
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

/**
 * IDrawable objects guarantee provisioning a couple of public,
 * externally handled generic entities which can be used to store
 * references to helper objects.
 */
export interface IDrawable {
    /**
     * Reference to a generic shape entity.
     * 
     * This is never touched by
     * the circles engine, you can store whatever you want inside
     * (or just leave it empty if you don't need it).
     */
    shape: object | undefined;

    /**
     * Reference to a generic type of ID.
     * 
     * This is never touched by
     * the circles engine, you can store whatever you want inside
     * (or just leave it empty if you don't need it).
     */
    id: any;
}

export enum EGeometryEventType {
    move = "move",
    resize = "resize",
}

export interface FOnGeometryEvent {
    (eventType: EGeometryEventType, entity: PureGeometry): void;
}

export enum EDrawableEventType {
    delete = "delete",
    add = "add",
    redraw = "redraw",
}

export type TDrawableGeometry = Circle | ArcPolygon;

export interface FOnDrawableEvent {
    (eventType: EDrawableEventType, entity: TDrawableGeometry): void;
}

export enum ETangencyType {
    innerTangent = "inner",
    outerTangent = "outer",
};

export enum EIntersectionType {
    lens = "lens"
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
    yin = "yin",
    yang = "yang",
    chaos = "chaos",
};

/**
 * Traversal direction for oriented edges.
 */
export enum ETraversalDirection {
    /**
     * Trigonometric direction. Encompasses regions inside the circle.
     */
    forward = "forward",

    /**
     * Clockwise direction; reverse the nodes when traversing. Encompasses regions outside the circle.
     */
    backward = "backward",
};

export interface IGraphEnd {
    node: GraphNode;
    direction: ETraversalDirection;
}

export interface IBoundingBox {
    minPoint: IPoint;
    maxPoint: IPoint;
}

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

export interface INextTangentEdge {
    edge: GraphEdge;
    sameSide: boolean;
}

export enum ERegionType {
    innerContour = "innerContour",
    outerContour = "outerContour",
    region = "region",
}

export enum ERegionDebugMode {
    none = "none",
    static = "static",
}

export enum ERoundingSize {
    small = "small",
    default = "default",
    large = "large",
}