import { IPoint } from "../../Types";

/**
 * Calculate the angle between the x axis and a segment defined by its start and end coordinates.
 * Reliably returns values between -PI and PI, if normalization is not requested.
 */
export const atan2 = (origin: IPoint, vector: IPoint) => {
    return Math.atan2(vector.y - origin.y, vector.x - origin.x);
}

const twoPi = Math.PI * 2;

export const normalizeAngle = (angle: number) => {
    let result = angle;
    while (result < 0) {
        result += twoPi;
    }

    while (result > twoPi) {
        result -= twoPi;
    }

    return result;
}
