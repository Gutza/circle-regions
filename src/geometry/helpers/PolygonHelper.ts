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

// TODO: Streamline this function

/**
 * The main "pure" helper polygon function -- it approximates
 * native circle-regions ArcPolygon entities to sets of points.
 * @param arcPolygon A region represented as a native arc polygon
 * @param resolution How many vertices per planar unit; the default is a reasonable compromise between accuracy and speed for 1:1 displays
 * @returns An array of coordinate pairs representing the points
 */
export const arcsToVertices = (arcPolygon: ArcPolygon, resolution = DEFAULT_RESOLUTION): IPoint[] => {
    let vertexCount = 0;
    arcPolygon.arcs.forEach(arc => {
        vertexCount += Math.max(2, Math.floor(resolution * arc.totalLength));
    });

    const vertices: IPoint[] = new Array(vertexCount);

    let arcsDone = 0;
    for (let arcIndex = 0; arcIndex < arcPolygon.arcs.length; arcIndex++) {
        const { startAngle, endAngle, totalLength } = arcPolygon.arcs[arcIndex];
        const { x, y } = arcPolygon.arcs[arcIndex].circle.center;
        const radius = arcPolygon.arcs[arcIndex].circle.radius;
        const arcLenAtRes = Math.max(2, Math.floor(resolution * totalLength));
        for (let θindex = 0; θindex < arcLenAtRes; θindex++) {
            const θ = startAngle + (θindex / arcLenAtRes) * (endAngle - startAngle);
            vertices[arcsDone + θindex] = {
                x: x + radius * Math.cos(θ),
                y: y + radius * Math.sin(θ),
            };
        }
        arcsDone += arcLenAtRes;
    }

    return vertices;
}