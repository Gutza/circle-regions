import CircleArc from "../CircleArc";

export namespace BezierHelper {
    /**
     * A generic Bezier vertex DTO structure.
     */
    export interface IVertexDTO {
        x: number,
        y: number,
        cpX: number,
        cpY: number,
    }

    /**
     * A generic Bezier circle arc DTO, made of several vertices.
     * Technically, this could hold any Bezier path; by convention,
     * in this context, it always holds circle arcs.
     */
    export interface IArcDTO {
        vertices: IVertexDTO[],
    }

    // Kappa * 4, because that's the way we need it here
    // For kappa, see http://www.whizkidtech.redprince.net/bezier/circle/kappa/
    const K4 = 4 * (Math.SQRT2 - 1) * (4 / 3);

    /**
     * A convenience function which rolls together all necessary logic and callbacks
     * for generating complete Bezier paths. It just calls @see verticesToAnchors()
     * and @see arcsToVertices(). Even if you choose to roll your own, make sure to
     * check out its code in order to understand how this is all supposed to work out.
     * @param arcs A @see CircleArc array representing a closed region
     * @param anchorCallback A callback mapping @see IVertexDTO entities unto Bezier vertex entities for your rendering engine of choice
     * @param pathCallback A callback mapping arrays of Bezier vertices unto path entities for your rendering engine of choice
     * @returns A single path entity
     */
    export function bezierPolygonArc<TPath, TAnchor>
        (
            arcs: CircleArc[],
            anchorCallback: (vertex1: IVertexDTO, vertex2: IVertexDTO) => TAnchor,
            pathCallback: (anchors: TAnchor[]) => TPath
        ): TPath {
            const vertices = arcsToVertices(arcs);
            const anchors = verticesToAnchors<TAnchor>(vertices, anchorCallback);
            return pathCallback(anchors);
    }

    /**
     * This is only "pure" Bezier helper function in the bunch -- it approximates
     * native circle-regions regions represented as @see CircleArc arrays as Bezier curves.
     * This function outputs conventional DTO Bezier entities, which then have to be
     * converted to entities native to the rendering engine you're using to actually display
     * the regions.
     * @param arcs An array of @see CircleArc entities which represent a closed region cycle.
     */
    export function arcsToVertices(arcs: CircleArc[]): IArcDTO[] {
        const arcMetas: IArcDTO[] = [];
        for (let arcIndex = 0; arcIndex < arcs.length; arcIndex++) {
            const arc = arcs[arcIndex];
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
                    x: xc + radius * cosAng,
                    y: yc + radius * sinAng,
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
    export function verticesToAnchors<TAnchor>(vertices: IArcDTO[], anchorCallback: (vertex1: IVertexDTO, vertex2: IVertexDTO) => TAnchor): TAnchor[] {
        const anchors: TAnchor[] = [];
        for (let arcIndex = 0; arcIndex < vertices.length; arcIndex++) {
            const arcMeta = vertices[arcIndex];

            // The last vertex is never drawn, since it would overlap the first vertex on the next arc.
            // Instead, collect the left CP from the last vertex on the previous arc when drawing
            // an arc's first vertex (or use the current vertex's left CP, if not on the first vertex.)
            for (let vIndex = 0; vIndex < arcMeta.vertices.length - 1; vIndex++) {
                const currV = arcMeta.vertices[vIndex];

                if (vIndex !== 0) {
                    anchors.push(anchorCallback(currV, currV));
                    continue;
                }

                let prevMeta: IArcDTO;
                if (arcIndex === 0) {
                    prevMeta = vertices[vertices.length - 1];
                } else {
                    prevMeta = vertices[arcIndex - 1];
                }
                anchors.push(anchorCallback(currV, prevMeta.vertices[prevMeta.vertices.length - 1]));
            }
        }

        return anchors;
    }
}