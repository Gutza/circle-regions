import { IPoint } from "../../Types";
import { ArcPolygon } from "../ArcPolygon";
import { makeSafeRenderingArc } from "./helperHelpers";

const DEFAULT_RESOLUTION = 0.1;

/**
 * The main convenience polygon rendering function -- it approximates native circle-regions
 * ArcPolygon entities to polygons, and maps the resulting entities to rendering-ready
 * entities, using your own callback functions.
 * @param arcPolygon A region represented as a native arc polygon
 * @param vertexCallback A callback which maps native vertices to rendering-ready polygon vertices
 * @param pathCallback A callback which maps rendering-ready arrays of polygon vertices to rendering-ready paths
 * @param resolution How many vertices per planar unit; the default is a reasonable compromise between accuracy and speed for 1:1 displays (one segment for every ten pixels)
 */
export function renderPolygonArc <TPath, TAnchor>
    (
        arcPolygon: ArcPolygon,
        vertexCallback: (vertex: IPoint) => TAnchor,
        pathCallback: (vertices: TAnchor[]) => TPath,
        resolution = DEFAULT_RESOLUTION
    ): TPath {
        const vertices = arcsToVertices(arcPolygon, resolution);
        const anchors = vertices.map(v => vertexCallback(v));
        return pathCallback(anchors);
}

/**
 * The main "pure" helper polygon function -- it approximates
 * native circle-regions ArcPolygon entities to sets of points.
 * @param arcPolygon A region represented as a native arc polygon
 * @param resolution How many vertices per planar unit; the default is a reasonable compromise between accuracy and speed for 1:1 displays
 * @returns An array of coordinate pairs representing the points
 */
function arcsToVertices (arcPolygon: ArcPolygon, resolution: number): IPoint[] {
    let vertexCount = 0;
    arcPolygon.arcs.forEach(arc => { vertexCount += Math.max(2, Math.floor(resolution * arc.totalLength)); });

    const vertices: IPoint[] = new Array(vertexCount);

    let vertexIndex = 0;
    arcPolygon.arcs.forEach(unsafeArc => {
        const arc = makeSafeRenderingArc(unsafeArc);
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