import { TTraversalDirection } from "../Types";
import GraphEdge from "./GraphEdge";

export default class GraphLoop {
    public oEdges: IOrientedEdge[] = [];
}

interface IOrientedEdge {
    edge: GraphEdge;
    direction: TTraversalDirection;
}