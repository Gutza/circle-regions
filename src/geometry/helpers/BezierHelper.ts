import { IPoint } from "../../Types";
import { ArcPolygon } from "../ArcPolygon";

/**
 * The main convenience Bezier function -- it rolls together all necessary logic and callbacks
 * for generating complete Bezier paths. This is probably the function you'll want to use.
 * @param arcs A @see CircleArc array representing a closed region
 * @param anchorCallback A callback mapping @see IInternalVertexDTO entities unto Bezier vertex entities for your rendering engine of choice
 * @param pathCallback A callback mapping arrays of Bezier vertices unto path entities for your rendering engine of choice
 * @returns A single path entity
 */
export function renderPolygonArc<TPath, TAnchor>
    (
        arcPolygon: ArcPolygon,
        anchorCallback: (vertex: IBezierVertex) => TAnchor,
        pathCallback: (anchors: TAnchor[]) => TPath
    ): TPath {
        const vertices = arcsToVertices(arcPolygon);
        const anchors = verticesToAnchors<TAnchor>(vertices, anchorCallback);
        return pathCallback(anchors);
}

/**
 * A conventional structure for transporting complete Bezier vertices.
 */
export interface IBezierVertex {
    /**
     * The coordinates of the vertex.
     */
    vcoords: IPoint,

    /**
     * The coordinates of the control point on the left.
     */
    leftCP: IPoint,

    /**
     * The coordinates of the control point on the right.
     */
    rightCP: IPoint,
}

/**
 * A conventional Bezier vertex DTO structure. By convention, these only
 * hold the coordinates of the current vertex, and the coordinates for the
 * next control point (not the coordinates of the previous control point).
 */
interface IInternalVertexDTO {
    /**
     * The x coordinate of the vertex.
     */
    vx: number,

    /**
     * The y coordinate of the vertex.
     */
    vy: number,

    /**
     * The x coordinate of the next control point.
     */
    cpX: number,

    /**
     * The y coordinate of the next control point.
     */
    cpY: number,
}

/**
 * A generic Bezier circle arc DTO, made of several vertices.
 * Technically, this could hold any Bezier path; by convention,
 * in this context, it always holds circle arcs.
 */
interface IArcDTO {
    vertices: IInternalVertexDTO[],
}

// Kappa * 4, because that's the way we need it here
// For kappa, see http://www.whizkidtech.redprince.net/bezier/circle/kappa/
const K4 = 4 * (Math.SQRT2 - 1) * (4 / 3);

/**
 * The main "pure" helper Bezier function -- it approximates
 * native circle-regions ArcPolygon entities to Bezier curves.
 * This function outputs conventional DTO Bezier entities, which then have to be
 * converted to entities native to the rendering engine you're using to actually display
 * the regions.
 * @param arcPolygon The arc polygon to convert
 * @returns An array of internal DTO entities
 */
function arcsToVertices(arcPolygon: ArcPolygon): IArcDTO[] {
    const arcMetas: IArcDTO[] = [];
    for (let arcIndex = 0; arcIndex < arcPolygon.arcs.length; arcIndex++) {
        const arc = arcPolygon.arcs[arcIndex];
        const arcMeta: IArcDTO = {
            vertices: [],
        };
        arcMetas.push(arcMeta);

        const radius = arc.circle.radius;
        const xc = arc.circle.center.x;
        const yc = arc.circle.center.y;

        // Two endpoints, plus one extra vertex for every 120 degrees.
        // That's at most 2 + 2 = 4 vertices, since all arcs are less than 360 degrees.
        // As such, each individual Bezier curve approximates an arc segment less than 90 degrees.
        const vertexCount = 2 + Math.floor(3 * arc.fractionalLength);
        const segmentCount = vertexCount - 1;
        const angularStep = (arc.endAngle - arc.startAngle) / segmentCount;
        const cpAmplitude = radius * K4 * arc.fractionalLength / segmentCount;
        const trigSign = arc.isClockwise ? -1 : 1;

        // Also compute the control points for the final vertex
        for (let vIndex = 0; vIndex < vertexCount; vIndex++) {
            const vertexAngle = arc.startAngle + angularStep * vIndex;
            const sinAng = Math.sin(vertexAngle);
            const cosAng = Math.cos(vertexAngle);

            arcMeta.vertices.push({
                vx: xc + radius * cosAng,
                vy: yc + radius * sinAng,
                cpX: +trigSign * sinAng * cpAmplitude,
                cpY: -trigSign * cosAng * cpAmplitude,
            });
        }
    }
    return arcMetas;
}

/**
 * Maps arrays of conventional arc DTOs unto arrays of concrete
 * Bezier anchor entities used by your rendering engine of choice.
 * Take a look at @see bezierPolygonArc() to see how this is supposed to be integrated
 * into your code.
 * @param vertices An array of conventional arcs, as produced by @see arcsToVertices()
 * @param anchorCallback A callback mapping conventional vertex pairs unto concrete Bezier anchor entities.
 */
function verticesToAnchors<TAnchor>(vertices: IArcDTO[], anchorCallback: (vertex: IBezierVertex) => TAnchor): TAnchor[] {
    const anchors: TAnchor[] = [];
    for (let arcIndex = 0; arcIndex < vertices.length; arcIndex++) {
        const arcMeta = vertices[arcIndex];

        // The last vertex is never drawn, since it would overlap the first vertex on the next arc.
        // Instead, collect the left CP from the last vertex on the previous arc when drawing
        // an arc's first vertex (or use the current vertex's left CP, if not on the first vertex.)
        for (let vIndex = 0; vIndex < arcMeta.vertices.length - 1; vIndex++) {
            const currV = arcMeta.vertices[vIndex];

            if (vIndex !== 0) {
                anchors.push(concreteAnchor(currV, currV, anchorCallback));
                continue;
            }

            let prevMeta: IArcDTO;
            if (arcIndex === 0) {
                prevMeta = vertices[vertices.length - 1];
            } else {
                prevMeta = vertices[arcIndex - 1];
            }
            anchors.push(concreteAnchor(currV, prevMeta.vertices[prevMeta.vertices.length - 1], anchorCallback));
        }
    }

    return anchors;
}

/**
 * An internal convenience function which converts @see IVertexDTO entities
 * to @see IDoubleVertexDTO entities, and then calls the appropriate callback
 * to convert them to entities appropriate for rendering.
 * @param currV The current vertex
 * @param leftCpV The previous vertex
 * @param anchorCallback The callback used to convert these to rendering entities.
 */
function concreteAnchor<TAnchor>(
        currV: IInternalVertexDTO,
        leftCpV: IInternalVertexDTO,
        anchorCallback: (vertex: IBezierVertex) => TAnchor
    ): TAnchor {
        return anchorCallback({
            vcoords: {
                x: currV.vx,
                y: currV.vy,
            },
            leftCP: {
                x: leftCpV.cpX,
                y: leftCpV.cpY,
            },
            rightCP: {
                x: -currV.cpX,
                y: -currV.cpY,
            },
        })
    }
