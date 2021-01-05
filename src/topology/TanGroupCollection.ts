import { Circle } from "../geometry/Circle";
import { ETangencyParity } from "../Types";

export class TangencyElement {
    public circle: Circle;
    public parity: ETangencyParity;

    constructor(circle: Circle, parity: ETangencyParity) {
        this.circle = circle;
        this.parity = parity;
    }
}

export class TangencyGroup {
    public elements: Map<number, TangencyElement> = new Map();

    public addElement = (circle: Circle, parity: ETangencyParity) => {
        this.elements.set(circle.internalId, new TangencyElement(circle, parity));
    }
}

export class TanGroupCollection {
    public tangencyGroups: TangencyGroup[] = [];

    public getGroupByCircle = (circle: Circle): TangencyGroup | undefined => {
        return this.tangencyGroups.find(group => group.elements.has(circle.internalId));
    }

    public addGroup = (tg: TangencyGroup): void => {
        this.tangencyGroups.push(tg);
    }

    public addSimpleGroup = (circle: Circle, parity: ETangencyParity = ETangencyParity.chaos) => {
        const newGroup = new TangencyGroup();
        this.addGroup(newGroup);
        newGroup.addElement(circle, parity);
    }

    public removeCircle = (circle: Circle): boolean => {
        for (let i = 0; i < this.tangencyGroups.length; i++) {
            if (this.tangencyGroups[i].elements.delete(circle.internalId)) {
                // A circle can only be present in one tangency group
                return true;
            }
        }
        return false;
    }

    public removeEmptyGroups = (): void => {
        this.tangencyGroups = this.tangencyGroups.filter(tanGroup => tanGroup.elements.size > 0);
    }
}