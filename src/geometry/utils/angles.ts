export const TWO_PI = Math.PI * 2;
export const HALF_PI = Math.PI / 2;

/**
 * Normalizes an arbitrary angle, constraining it to [0...2π]
 * @param angle Any angle in radians, potentially outside [0...2π]
 */
export const normalizeAngle = (angle: number) => {
    return angle - TWO_PI * Math.floor(angle / TWO_PI);
}
