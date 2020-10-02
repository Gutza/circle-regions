# Circle Intersection Regions
[![GitHub Actions status](https://github.com/gutza/circle-regions/workflows/mocha/badge.svg?branch=master)](https://github.com/gutza/circle-regions/actions)

A blazingly fast solution for computing all regions in a 2D plane resulted from intersecting any number of circles, in any configuration.
This is essentially the engine inside [Harrison Hogg's](http://hogg.io/) wonderful "[circles](https://github.com/HHogg/circles)" art project – check it out live [here](https://circles.hogg.io/); the algorithm is described on [HHogg's website](https://hogg.io/writings/circle-intersections).
I also saved the algorithm description on the [Wayback Machine](https://web.archive.org/web/20200930112821/https://hogg.io/writings/circle-intersections), in case he decides to drop it off the website for some reason.

## Installation
The library works both in NodeJS, and as a stand-alone, browser library (use the browser approach below to [test it on Runkit](https://npm.runkit.com/circle-regions)).

### NodeJS
Install it with

```shell
npm install circle-regions
```

And use it

```javascript
"use strict";
const circleRegions = require('circle-regions');

console.log(circleRegions.getIntersectionRegions([
  {
    x: 0,
    y: 0,
    radius: 1
  },
  {
    x: 0.5,
    y:0.5,
    radius: 1
  }
]));
```

Typescript is also supported; the definitions are bundled with the npm package.

### Browser
Generate the JavaScript bundle

```shell
npm run browserify
```

This will produce a plain JavaScript file called `circle-regions.Bundle.js`, which you can load in your HTML file. You can then use it

```javascript
console.log(circleRegions.getIntersectionRegions([
  {
    x: 0,
    y: 0,
    radius: 1
  },
  {
    x: 0.5,
    y:0.5,
    radius: 1
  }
]));
```
