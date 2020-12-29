import { IPoint } from "../../Types";
import { ArcPolygon } from "../ArcPolygon";

const DEFAULT_RESOLUTION = 0.1;

export function renderPolygonArc <TPath, TAnchor>
    (
        arcPolygon: ArcPolygon,
        anchorCallback: (vertex: IPoint) => TAnchor,
        pathCallback: (vertices: TAnchor[]) => TPath,
        resolution = DEFAULT_RESOLUTION
    ): TPath {
        const vertices = arcsToVertices(arcPolygon, resolution);
        const anchors = vertices.map(v => anchorCallback(v));
        return pathCallback(anchors);
}

/**
 * The main "pure" helper polygon function -- it approximates
 * native circle-regions ArcPolygon entities to sets of points.
 * @param arcPolygon A region represented as a native arc polygon
 * @param resolution How many vertices per planar unit; the default is a reasonable compromise between accuracy and speed for 1:1 displays
 * @returns An array of coordinate pairs representing the points
 */
export function arcsToVertices (arcPolygon: ArcPolygon, resolution = DEFAULT_RESOLUTION): IPoint[] {
    let vertexCount = 0;
    arcPolygon.arcs.forEach(arc => { vertexCount += Math.max(2, Math.floor(resolution * arc.totalLength)); });

    const vertices: IPoint[] = new Array(vertexCount);

    let vertexIndex = 0;
    arcPolygon.arcs.forEach(arc => {
        const { startAngle, endAngle, totalLength } = arc;
        const { x: centerX, y: centerY } = arc.circle.center;
        const radius = arc.circle.radius;
        const arcLenAtRes = Math.max(2, Math.floor(resolution * totalLength));
        for (let θindex = 0; θindex < arcLenAtRes; θindex++) {
            const θ = startAngle + (θindex / arcLenAtRes) * (endAngle - startAngle);
            vertices[vertexIndex] = {
                x: centerX + radius * Math.cos(θ),
                y: centerY + radius * Math.sin(θ),
            };
            vertexIndex++;
        }
    })

    return vertices;
}