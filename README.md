# Circle Intersection Regions
[![GitHub Actions status](https://github.com/gutza/circle-regions/workflows/mocha%20test/badge.svg?branch=master)](https://github.com/gutza/circle-regions/actions)
[![GitHub Actions status](https://github.com/gutza/circle-regions/workflows/browserify/badge.svg?branch=master)](https://github.com/gutza/circle-regions/actions)

This is probably the world's fastest solution for computing all regions on a 2D plane resulted from intersecting any number of circles, in any configuration. This is 100% original art; this library was originally inspired by [Harrison Hogg's](http://hogg.io/) wonderful "[circles](https://github.com/HHogg/circles)" art project, but the current version is a completely original approach, and the entire library was completely rewritten from scratch.

## Project history
*Feel free to skip on to the installation section below if you're not interested in this.*

Harrison Hogg's project, which you can check out live [here](https://circles.hogg.io/), inspired me back in September 2020 to search for an efficient way to algorithmically partition the plane as dictated by intersecting circles. His original algorithm is described on [HHogg's website](https://hogg.io/writings/circle-intersections) – and I also saved the algorithm description on the [Wayback Machine](https://web.archive.org/web/20200930112821/https://hogg.io/writings/circle-intersections), in case he decides to drop it off the website for some reason.

I extracted Harrison's engine as a stand-alone library in September-October 2020, and that was the 0.x tier of this library. Harrison's algorithm (and code) proved the problem was tractable, but ultimately I wasn't completely happy with his solution. His approach is based on extensive geometric verifications, which slows things down considerably. I also bumped into some issues with his code for some edge cases, although to be honest I don't know if these are caused by fixable bugs in his code or by some limitations built into his algorithm. None of these are real show-stoppers for his art project, but I wanted this to be really high octane – and that approach just wasn't enough.

I wanted this library to be as fast as it possibly could, and I wanted to treat all possible circle configurations on a 2D plane. Algorithms (and even problems) in this area are typically broken down into the following categories:
- full: treat all cases;
- no tangencies: can treat all cases except tangent circles;
- no concurrent intersections: only two circles can intersect at any one point;
- no tangencies *and* no concurrent intersections allowed.

At first glance, it seems like tangency and concurrent intersection limitations are not a big deal at all – after all, the 2D plane is quite vast, you can easily make sure circles aren't ever tangent, right? Also, why would you really ever need to intersect more than two circles in a single point? Well, it turns out there are quite a lot of commonplace setups where both of those types of configurations pop up. Think about circles intersecting at the origin – you only need a circle with radius 5 centered at (0,5), and another circle with radius 4 centered at (0,-4): tangency! Add another circle with radius 3 at (3,0) and you end up with three circles intersecting at the origin, two of which are tangent. So I decided to go full monty.

During October-November 2020 I created and refined the main algorithm and most of the code architecture for tier 1.x. I had planned (and announced) that I'd release the new version in November at the latest, but I had a really hectic period at work, and the code turned out to need way more refinement than I had originally anticipated. So here I was, on December 30th, writing this document in order to publish version 1.0.0-alpha.1 in 2020 (which did happen).

## Features
- Works properly for all possible circle configurations – any number of inner and/or outer concurrent tangencies, any number of circles intersecting at the same point, any combination of inner tangent/outer tangent/secant intersections at the same point;
- Properly handles the floating point precision in JavaScript to reliably identify concurrent tangencies and intersections;
- Configurable precision, with a couple of presets for atypical setups (particularly small and particularly large scales);
- It does *not* use [big-js](https://www.npmjs.com/package/big-js) or friends, for two reasons: performance, and those libraries' limitations when it comes to trig functions;

![Region elements](images/contour-demo.png)
- It properly discriminates between contours and regions which partition circles;
- It properly discriminates between inner and outer contours;
- It provides helper methods for easily rendering the resulting regions using your rendering engine of choice (both polygonal and Bezier); both approaches employ world-class output precision – and using any SVG renderer you can easily export the output to very precise SVG files;
- It caches everything that can be cached from one iteration to the next (moving a circle outside of the arrangement doesn't cause all intersections and regions to be recomputed);
- As a by-product of intersecting all circles, it correctly identifies circles wholly contained in other circles;
- Supports event-driven rendering;
- The library features very defensive programming and extensive self-diagnosis, in order to help identifying and reporting bugs;
- Small footprint, and extremely spartan dependencies.

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
npm i circle-regions@1.0.0-alpha.6
```

Change the version number, if you have to (I might forget to update the documentation on every release). Then use it:

```javascript
"use strict";
const CircleRegions = require('circle-regions');
const engine = new CircleRegions.RegionEngine();
const c1 = engine.add(0, 5, 5);
const c2 = engine.add(0, -4, 4);
const c3 = engine.add(3, 0, 3);
console.log(engine.computeRegions());
```

### Browser
Depending on your preferred workflow, you might want to write pure JavaScript all the way, or pure TypeScript all the way. As such, you're either going to transpile this library to JavaScript prior to integrating it with your project, or you're going to write your TypeScript code using this library, and then transpile the whole thing to JavaScript.

If you're using TypeScript you already know how to set up your project and transpile, so I won't document that here. If you need a pure JavaScript export of this library, you have to clone this repository locally, then execute

```shell
npm install
npm run browserify
```

This will produce a plain JavaScript file called `circle-regions.Bundle.js`, which you can load in your HTML file.

### Rendering
Here are a couple of examples rendering circles with [Two.js](https://two.js.org/), using TypeScript:

```typescript
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
```typescript
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
```typescript
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

    const tInnerContours = new Two.Group();
    tInnerContours.id = "inner-contours";

    tCircleGeometry.add(tOuterContours, tInnerContours, tRegions);

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
        const rCircle = demoRegionEngine.add(ev.x, ev.y, circRad);

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

    const handleDelete = (arcPolygon: CircleRegions.ArcPolygon) => {
        const twoPath = arcPolygon.shape as Two.Path;
        switch(arcPolygon.regionType) {
            case CircleRegions.ERegionType.region:
                tRegions.remove(twoPath);
                break;
            case CircleRegions.ERegionType.innerContour:
                tInnerContours.remove(twoPath);
                break;
            case CircleRegions.ERegionType.outerContour:
                tOuterContours.remove(twoPath);
                break;
            default:
                throw new Error(`Unexpected region type: ${arcPolygon.regionType}`);
        }

        two.update();
    }

    const handleAdd = (arcPolygon: CircleRegions.ArcPolygon) => {
        const tPolygonArc = createPolygonArc(arcPolygon);
        const tGroup = new Two.Group();
        tGroup.add(tPolygonArc);
        arcPolygon.shape = tGroup;

        switch(arcPolygon.regionType) {
            case CircleRegions.ERegionType.region:
                tPolygonArc.linewidth = 1;
                tPolygonArc.fill = randomColor();
                tRegions.add(tGroup);
                break;
            case CircleRegions.ERegionType.innerContour:
                tPolygonArc.linewidth = 6;
                tPolygonArc.fill = "#f00";
                tInnerContours.add(tGroup);
                break;
            case CircleRegions.ERegionType.outerContour:
                tPolygonArc.linewidth = 6;
                tPolygonArc.fill = "none";
                tOuterContours.add(tGroup);
                break;
            default:
                throw new Error(`Unexpected region type: ${arcPolygon.regionType}`);
        }

        two.update();
    }

    demoRegionEngine.onRegionChange = (evtype, arcPolygon) => {
        switch(evtype) {
            case CircleRegions.EDrawableEventType.delete:
                handleDelete(arcPolygon);
                break;
            case CircleRegions.EDrawableEventType.add:
                handleAdd(arcPolygon);
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