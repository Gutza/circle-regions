import { Circle } from "./geometry/Circle";
import { Point } from "./geometry/Point";
import { RegionEngine } from "./RegionEngine";
import { ERegionDebugMode } from "./Types";

class TestCircle extends Circle {
    public test: boolean = true;
    constructor(center: Point, radius: number) {
        super(center, radius);
    }
}

export class DebugEngine {
    public static checkStatic = (circles: Circle[]): {circles: Circle[], numericReproducible: boolean, stringReproducible: boolean } => {
        const testCircles = circles.map(circle => new TestCircle(circle.center, circle.radius));
        if (!DebugEngine._isStaticallyReproducible(testCircles)) {
            return {circles: [], numericReproducible: false, stringReproducible: false};
        }

        // We now know we can reproduce the issue statically -- but can we represent the values as strings?
        const canonicalCircles =  DebugEngine._canonicalStatic(testCircles);
        const _testFromString = canonicalCircles.map(circle => new TestCircle(
            new Point(Number.parseFloat(circle.center.x.toString()), Number.parseFloat(circle.center.y.toString())),
            Number.parseFloat(circle.radius.toString())
        ));

        const reproducibleFromString  = DebugEngine._isStaticallyReproducible(_testFromString);
        return {circles: canonicalCircles, numericReproducible: true, stringReproducible: reproducibleFromString };
    }

    private static _isStaticallyReproducible = (circles: TestCircle[]): boolean => {
        const regionEngine = new RegionEngine(ERegionDebugMode.none);
        circles.forEach(circle => {
            if (circle.test) {
                regionEngine.addCircle(circle);
            }
        });

        try {
            regionEngine.regions;
        } catch(e) {
            return true;
        }

        return false;
    }

    private static _canonicalStatic = (circles: TestCircle[], depth: number = 0): Circle[] => {
        for (let i = 0; i < circles.length; i++) {
            circles[i].test = false;
            if (DebugEngine._isStaticallyReproducible(circles)) {
                continue;
            }
            circles[i].test = true;
        }
        return circles.filter(circle => circle.test);
    }
}