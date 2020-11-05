import { Circle } from "./geometry/Circle";
import { RegionEngine } from "./RegionEngine";
import { ERegionDebugMode } from "./Types";

export class DebugEngine {
    public static checkStatic = (circles: Circle[]): boolean => {
        const regionEngine = new RegionEngine(ERegionDebugMode.none);
        circles.forEach(circle => {
            regionEngine.addCircle(circle);
        });
        try {
            regionEngine.regions;
        } catch(e) {
            return true;
        }

        return false;
    }
}