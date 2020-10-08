import CircleGraph from "../../topology/CircleGraph";
import { IPoint } from "../../Types";
import Circle from "../Circle";
import { round } from "./numbers";

export default (graph: CircleGraph, circle1: Circle, circle2: Circle): void => {
    if (circle1 === circle2) {
        console.warn("Don't intersect a circle with itself!");
        return;
    }

    // Math.sqrt(a**2 + b**2) is more precise than Math.hypot(a, b)
    const centerDist = Math.sqrt((circle1.center.x - circle2.center.x) ** 2 + (circle1.center.y - circle2.center.y) ** 2);
    if (round(centerDist) > round(circle1.radius + circle2.radius)) {
        return;
    }

    if (round(circle1.radius) > round(centerDist + circle2.radius)) {
        circle1.addChild(circle2);
        circle2.addParent(circle1);
        return;
    }

    if (round(circle2.radius) > round(centerDist + circle1.radius)) {
        circle2.addChild(circle1);
        circle1.addParent(circle2);
        return;
    }

    const a = (circle1.radius**2 - circle2.radius**2 + centerDist**2) / (2 * centerDist);
    const h = Math.sqrt(circle1.radius**2 - a**2);
    const x = circle1.center.x + a * (circle2.center.x - circle1.center.x) / centerDist;
    const y = circle1.center.y + a * (circle2.center.y - circle1.center.y) / centerDist;

    if (round(circle1.radius + circle2.radius) == round(centerDist)) {
        const tangentPoint: IPoint = {
            x: x,
            y: y,
        };
        graph.addNode(circle1, circle2, tangentPoint, "outerTangent");
        return;
    }

    if (round(Math.abs(circle1.radius - circle2.radius)) == round(centerDist)) {
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