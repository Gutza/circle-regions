const twoPi = Math.PI * 2;

/**
 * Normalizes an arbitrary angle, constraining it to [0...2π]
 * @param angle Any angle in radians, potentially outside [0...2π]
 */
export const normalizeAngle = (angle: number) => {
    return angle - twoPi * Math.floor(angle / twoPi);
}
