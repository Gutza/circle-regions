import CircleGraph from "../../topology/CircleGraph";
import { IPoint } from "../../Types";
import Circle from "../Circle";

export default (graph: CircleGraph, circle1: Circle, circle2: Circle): void => {
    if (circle1 === circle2) {
        console.warn("Don't intersect a circle with itself!");
        return;
    }

    const centerDist = Math.hypot(circle1.center.x - circle2.center.x, circle1.center.y - circle2.center.y);
    if (centerDist > circle1.radius + circle2.radius) {
        return;
    }

    if (circle1.radius > centerDist + circle2.radius) {
        circle1.addChild(circle2);
        circle2.addParent(circle1);
        return;
    }

    if (circle2.radius > centerDist + circle1.radius) {
        circle2.addChild(circle1);
        circle1.addParent(circle2);
        return;
    }

    const a = (circle1.radius**2 - circle2.radius**2 + centerDist**2) / (2 * centerDist);
    const h = Math.sqrt(circle1.radius**2 - a**2);
    const x = circle1.center.x + a * (circle2.center.x - circle1.center.x) / centerDist;
    const y = circle1.center.y + a * (circle2.center.y - circle1.center.y) / centerDist;

    if (circle1.radius + circle2.radius == centerDist) {
        const tangentPoint: IPoint = {
            x: x,
            y: y,
        };
        graph.addNode(circle1, circle2, tangentPoint, "outerTangent");
        return;
    }

    if (Math.abs(circle1.radius - circle2.radius) == centerDist) {
        const tangentPoint: IPoint = {
            x: x,
            y: y,
        };
        graph.addNode(circle1, circle2, tangentPoint, "innerTangent");
        return;
    }

    const hDistRatio = h / centerDist;
    const rx = -(circle2.center.y - circle1.center.y) * hDistRatio;
    const ry = -(circle2.center.x - circle1.center.x) * hDistRatio;

    const point1: IPoint = {
        x: x+rx,
        y: y-ry,
    };
    graph.addNode(circle1, circle2, point1, "lens");

    const point2: IPoint = {
        x: x-rx,
        y: y+ry,
    }
    graph.addNode(circle1, circle2, point2, "lens");
}