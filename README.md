# Circle Intersection Regions
[![GitHub Actions status](https://github.com/gutza/circle-regions/workflows/mocha%20test/badge.svg?branch=master)](https://github.com/gutza/circle-regions/actions)
[![GitHub Actions status](https://github.com/gutza/circle-regions/workflows/browserify/badge.svg?branch=master)](https://github.com/gutza/circle-regions/actions)

This is probably the world's fastest solution for computing all regions in a 2D plane resulted from intersecting any number of circles, in any configuration. This is 100% original art; this library was originally inspired by [Harrison Hogg's](http://hogg.io/) wonderful "[circles](https://github.com/HHogg/circles)" art project, but the current version is a completely original approach, and the entire library was completely rewritten from scratch.

## Project history
*Feel free to skip on to the installation section below if you're not interested in this.*

Harrison Hogg's project, which you can check out live [here](https://circles.hogg.io/), inspired me back in September 2020 to search for an efficient way to algorithmically partition the plane as dictated by intersecting circles. His original algorithm is described on [HHogg's website](https://hogg.io/writings/circle-intersections) – and I also saved the algorithm description on the [Wayback Machine](https://web.archive.org/web/20200930112821/https://hogg.io/writings/circle-intersections), in case he decides to drop it off the website for some reason.

I extracted Harrison's engine as a stand-alone library in September-October 2020, and that was the 0.x tier of this library. Harrison's algorithm (and code) proved the problem was tractable, but ultimately I wasn't completely happy with his solution. His approach is based on extensive geometric verifications, which slows things down considerably. I'm not sure if there are bugs in his code of whether his algorithm has some built-in limitations, as well, but I also bumped into some issues in some edge cases. None of these are real show-stoppers for his art project, but I wanted this to be really high octane – and that approach just wasn't enough.

I wanted this library to be as fast as it possibly could, and I wanted to treat all possible circle configurations on a 2D plane. Algorithms (and even problems) in this area are typically broken down into the following categories:
- Full: can treat all cases
- No tangencies: can treat all cases except tangent circles
- No concurrent intersections: only two circles can intersect at any one point
- No tangencies AND no concurrent intersections.

At first glance, it seems like tangency and concurrent intersection limitations are not a big deal – after all, the 2D plane is quite vast, you can easily make sure circles aren't ever tangent, right? Also, why would you really ever need to intersect more than two circles in a single point? Well, it turns out there are quite a lot of common-place setups where both of those types of configurations pop up. Think about circles intersecting in the origin – you only need a circle with radius 5 centered at (0,5), and another circle with radius 4 centered at (0,-4): tangency. Add another circle with radius 3 at (3,0) and you end up with three circles intersecting at the origin, two of which are tangent. So I decided to go full monty.

During October-November 2020 I created and refined the main algorithm and most of the code architecture for tier 1.x. I had planned (and announced) that I'd release the new version in November at the latest, but I had a really hectic period at work, and the code turned out to need much more refinement than I had originally anticipated. So here I am, on December 30th, writing this document – and the code is not pushed to NPM yet.

## Features
- Works properly for all possible circle configurations – any number of inner and/or tangent circles, any number of circles intersecting at the same point;
- Properly handles the floating point precision in JavaScript to reliably identify concurrent tangencies and intersections;
- Configurable precision, with a couple of presets for atypical setups (particularly small and particularly large scales);
- It does *not* use [big-js](https://www.npmjs.com/package/big-js) or friends, for two reasons: performance, and those libraries' limitations when it comes to trig functions;
- It properly discriminates between regions which partition circles and contours;
- It properly discriminates between inner and outer contours;
- It provides helper methods for easily rendering the resulting regions using your rendering engine of choice (both polygonal and Bezier); both approaches employ world-class output precision;
- It caches everything that can be cached from one iteration to the next (moving a circle outside of the arrangement doesn't cause all intersections and regions to be re-evaluated);
- As a by-product of intersecting all circles, it correctly identifies circles wholly contained in other circles;
- Supports event-driven rendering.

## Status and known limitations
The 1.x tier is still in alpha. The actual intersection engine is already very robust (to my knowledge), but there are still issues with several secondary mechanisms:
- there's a bit of confusion over the status of stand-alone circles – are they really external contours, or are they enclosed in larger circles?
- inner contours are also a bit confusing right now: if a circle completely encompasses an interior contour, the region is still deemed as an interior contour;
- the code still contains quite a lot of defensive verifications, some of which are relatively expensive;
- the event system is not fully tested (I have a suspicion it fires too frequently, but I haven't tested that properly yet);
- region areas are currently not computed, and several other planned features are not yet implemented;
- as of yet, there is no attempt to persist the identity of *changing* regions throughout recomputations. For instance, if your setup is made of two intersecting circles, and one of them moves my a single pixel, there's no guarantee that the new regions after recomputation preserve the same order, or indeed that there are any means of easily identifying which previous region maps unto which new region (the problem is trivial for two circles, but it becomes very difficult very quickly). This is an intrinsically difficult problem to solve, and implementing this properly will probably mark the next major milestone for this project.

Having said that, the code should already be perfectly adequate for most uses, but if you need bells and whistles you're probably going to have to wait for a bit longer.

## Installation
The library can be used both in NodeJS, and as a stand-alone, browser library – and it comes with full TypeScript support out of the box. I used yarn for package management, but you can use npm just as well (as shown here).

### NodeJS
Install it with

```shell
npm install circle-regions
```

And use it

```javascript
"use strict";
const CircleRegions = require('circle-regions');
const engine = new CircleRegions.RegionEngine();
var c1 = engine.add(0, 5, 5);
var c2 = engine.add(0, -4, 4);
var c3 = engine.add(3, 0, 3);
console.log(engine.);
```

Typescript is also supported; the definitions are bundled with the npm package.

### Browser
Generate the JavaScript bundle

```shell
npm run browserify
```

This will produce a plain JavaScript file called `circle-regions.Bundle.js`, which you can load in your HTML file.

Here are a couple of examples rendering circles in [Two.js](https://two.js.org/):

```javascript
// Polygon rendering

import * as CircleRegions from 'circle-regions';
import Two from 'two.js';

export const createPolygonArc = (arcPolygon: CircleRegions.ArcPolygon): Two.Path => (
    CircleRegions.PolygonHelper.renderPolygonArc(
        arcPolygon,
        vertex => new Two.Vector(vertex.x, vertex.y),
        anchors => new Two.Path(anchors, true, false)
    )
);
```
or

```javascript
// Bezier rendering

import * as CircleRegions from 'circle-regions';
import Two from 'two.js';

export const createPolygonArc = (arcPolygon: CircleRegions.ArcPolygon): Two.Path => (
    CircleRegions.BezierHelper.renderPolygonArc(
        arcPolygon,
        (vertex) => (
            new Two.Anchor(
                vertex.vcoords.x, vertex.vcoords.y,
                vertex.leftCP.x, vertex.leftCP.y,
                vertex.rightCP.x, vertex.rightCP.y,
                Two.Commands.curve
            )
        ),
        anchors => new Two.Path(anchors, true, false, true)
    )
);
```

You can then use either of those to render your regions like so:
```javascript
import * as CircleRegions from "circle-regions";
import { createPolygonArc } from "./graphics/CreatePolyArc"; // <-- your createPolygonArc library (see above)
import Two from "two.js";

export const run = () => {
    let two = new Two({
        type: Two.Types.svg,
        fullscreen: true,
        autostart: true
    });

    two.appendTo(document.body);
    const twoHtmlElem = (two.renderer as any).domElement as HTMLElement;

    const tCircleGeometry = two.makeGroup();
    tCircleGeometry.id = "circle-geometry";
    
    const tOuterContours = new Two.Group();
    tOuterContours.id = "outer-contours";
    
    const tRegions = new Two.Group();
    tRegions.id = "regions";
    const tCircles = new Two.Group();
    tCircles.id = "circles";
    const tInnerContours = new Two.Group();
    tInnerContours.id = "inner-contours";
    tCircleGeometry.add(tOuterContours, tInnerContours, tRegions, tCircles);

    const demoRegionEngine = new CircleRegions.RegionEngine();
    type OriginalPosition = {
        circle: CircleRegions.Circle,
        center: CircleRegions.IPoint,
    };

    let
        isMouseDown = false,
        mouseDownStart: CircleRegions.Point,
        originalCircles: OriginalPosition[] = [],
        movedCircles: CircleRegions.Circle[] = [];

    twoHtmlElem.addEventListener("mousedown", ev => {
        isMouseDown = true;
        mouseDownStart = new CircleRegions.Point(ev.x, ev.y);
        movedCircles = demoRegionEngine.circles.filter(circle => circle.isPointInside(mouseDownStart));
        originalCircles = movedCircles.map(circle => ({
            center: { x: circle.center.x, y: circle.center.y },
            circle: circle
        }));
    });

    twoHtmlElem.addEventListener("mouseup", ev => {
        isMouseDown = false;

        if (ev.x - mouseDownStart.x || ev.y - mouseDownStart.y) {
            return;
        }
        const circRad = 50;
        const rCircle = new CircleRegions.Circle(new CircleRegions.Point(ev.x, ev.y), circRad);
        demoRegionEngine.addCircle(rCircle);

        if (demoRegionEngine.isStale) {
            demoRegionEngine.computeRegions();
        }
    });

    twoHtmlElem.addEventListener("mousemove", ev => {
        if (!isMouseDown) {
            return;
        }

        movedCircles.forEach(movedCircle => {
            const originalCircle = originalCircles.find(circle => circle.circle === movedCircle);
            if (originalCircle === undefined) {
                throw new Error("Can't find circle!");
            }
            movedCircle.center.x = originalCircle.center.x + ev.x - mouseDownStart.x;
            movedCircle.center.y = originalCircle.center.y + ev.y - mouseDownStart.y;
        });

        if (demoRegionEngine.isStale) {
            demoRegionEngine.computeRegions();
        }
    });

    const handleRedraw = (entity : CircleRegions.Circle | CircleRegions.ArcPolygon) => {
        if (entity instanceof CircleRegions.Circle) {
            const child = entity.shape as Two.Circle;
            tCircles.remove(child);

            if (!entity.isDisplayed) {
                return;
            }
            const tShape = new Two.Circle(entity.center.x, entity.center.y, entity.radius);
            tShape.linewidth = 6;
            entity.shape = tShape;
            tCircles.add(tShape);
            two.update();
        }
    }

    const handleDelete = (entity: CircleRegions.Circle | CircleRegions.ArcPolygon) => {
        const path = entity.shape as Two.Path;
        if (entity instanceof CircleRegions.Circle) {
            tCircles.remove(path);
            return;
        }

        if (entity.regionType === CircleRegions.ERegionType.region) {
            tRegions.remove(path);
        } else {
            if (entity.regionType === CircleRegions.ERegionType.innerContour) {
                tInnerContours.remove(path);
            } else {
                tOuterContours.remove(path);
            }
        }
    }

    const handleAdd = (entity: CircleRegions.Circle | CircleRegions.ArcPolygon) => {
        if (entity instanceof CircleRegions.Circle) {
            const tShape = new Two.Circle(entity.center.x, entity.center.y, entity.radius);
            entity.shape = tShape;
            tShape.linewidth = 6;
            tCircles.add(tShape);
        } else {
            const tPolygonArc = createPolygonArc(entity);
            const tGroup = new Two.Group();
            tGroup.add(tPolygonArc);
            entity.shape = tGroup;

            if (entity.regionType !== CircleRegions.ERegionType.region) {
                tPolygonArc.linewidth = 6;
                if (entity.regionType === CircleRegions.ERegionType.outerContour) {
                    tPolygonArc.fill = "none";
                    tOuterContours.add(tGroup);
                } else {
                    tPolygonArc.fill = "#f00";
                    tInnerContours.add(tGroup);
                }
            } else {
                tPolygonArc.fill = randomColor();
                tRegions.add(tGroup);
            }
        }

        two.update();
    }

    demoRegionEngine.onRegionChange = (evtype, entity) => {
        switch(evtype) {
            case CircleRegions.EDrawableEventType.redraw:
                handleRedraw(entity);
                break;
            case CircleRegions.EDrawableEventType.delete:
                handleDelete(entity);
                break;
            case CircleRegions.EDrawableEventType.add:
                handleAdd(entity);
                break;
            default:
                throw new Error(`Unknown event type: ${evtype}`);
        }
    };
};

const colGamut = 256 ** 3;

const randomColor = (): string => {
    return "#" + Math.round(Math.random() * colGamut).toString(16).padStart(6, "0");
}
```