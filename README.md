# Circle Intersection Regions

A blazingly fast solution for computing all regions in a 2D plane resulted from intersecting any number of circles, in any configuration. This is essentially the engine inside [Harrison Hogg's](http://hogg.io/) wonderful "[circles](https://github.com/HHogg/circles)" art project – check it out live [here](https://circles.hogg.io/); the algorithm is described on [HHogg's website](https://hogg.io/writings/circle-intersections).

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

console.log(circleRegions.getIntersectionAreas([
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

### Browser

Generate the JavaScript bundle

```shell
./browserify.js
```

And use it

```javascript
console.log(circleRegions.getIntersectionAreas([
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
