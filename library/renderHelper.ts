import Region from './getIntersectionRegions/Region';

/**
 * A helper function which renders a region as a polygon (actually, as a set of vertices)
 * @param region A region resulted from intersecting circles using @see getIntersectionRegions()
 * @param resolution An optional resolution -- how many vertices per planar unit to return. 0.1 is a reasonable compromise between accuracy and speed.
 * @returns An array of coordinate pairs representing the points
 */
export const renderPoly = (region: Region, resolution: number = 0.1): {x:number, y:number}[] => {
    let totalCount = 0;
    region.arcs.forEach(arc => {
        totalCount += Math.max(2, Math.floor(resolution * arc.arcLength));
    });
    const points: {x:number, y:number}[] = Array
        .from({ length: totalCount})
        .map(() => ({x:0, y:0}));

    let arcsDone = 0;
    for (let a = 0; a < region.arcs.length; a++) {
        const { a1, a2, x, y, radius, arcLength } = region.arcs[a];
        const arcLenAtRes = Math.max(2, Math.floor(resolution * arcLength));
        for (let θindex = 0; θindex < arcLenAtRes; θindex++) {
            const point = points[arcsDone + θindex];
            const θ = a1 + (θindex / arcLenAtRes) * (a2 - a1);

            point.x = x + radius * Math.cos(θ);
            point.y = y + radius * Math.sin(θ);
        }
        arcsDone += arcLenAtRes;
    }

    return points;
}