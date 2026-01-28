# maker.js-pathkit

A shim package for integrating [Maker.js](https://maker.js.org) with [Skia PathKit](https://skia.org/docs/user/modules/pathkit/).

## Purpose

This package provides utilities for:

1. **Font ingestion** - Convert font glyphs to Maker.js models using PathKit
2. **Boolean operations** - Perform advanced boolean operations on paths using Skia's PathKit

## Installation

```bash
npm install maker.js-pathkit
```

Note: This package requires `pathkit-wasm` and has a peer dependency on `makerjs`.

## Usage

### Font Ingestion with Fontkit

```javascript
const makerPathKit = require('maker.js-pathkit');

// Initialize PathKit
await makerPathKit.init();

// Load a font
const font = await makerPathKit.loadFont('path/to/font.ttf');
// Or from a buffer:
// const font = await makerPathKit.loadFont(fontBuffer);

// Convert a single character to PathKit path
const glyphPath = makerPathKit.fontGlyphToPath(font, 'A', 72);
const svgPath = makerPathKit.pathToSVGString(glyphPath);
console.log(svgPath);

// Clean up
glyphPath.delete();

// Convert entire text string to paths
const textPaths = makerPathKit.textToPathKitPaths(font, 'Hello', 72);
textPaths.forEach(({ path, x, y }) => {
    console.log(`Glyph at (${x}, ${y}):`, makerPathKit.pathToSVGString(path));
    path.delete();
});

// Or combine all characters into a single path
const combinedPath = makerPathKit.textToPathKit(font, 'Hello', 72);
console.log(makerPathKit.pathToSVGString(combinedPath));
combinedPath.delete();
```

### Boolean Operations with Maker.js Integration

```javascript
const makerPathKit = require('maker.js-pathkit');
const makerjs = require('makerjs');

// Initialize PathKit
await makerPathKit.init();

// Create some Maker.js models
const model1 = new makerjs.models.Rectangle(100, 100);
const model2 = new makerjs.models.Circle(60);
model2.origin = [50, 50];

// Perform boolean operations using PathKit
const unionModel = makerPathKit.booleanOperation(model1, model2, 'union', makerjs);
const intersectModel = makerPathKit.booleanOperation(model1, model2, 'intersect', makerjs);
const differenceModel = makerPathKit.booleanOperation(model1, model2, 'difference', makerjs);

// Export results
const svg = makerjs.exporter.toSVG(unionModel);
console.log(svg);

// Or use the helper to load makerjs
const makerjs = makerPathKit.requireMakerJs();
```

### Direct PathKit Operations

```javascript
const makerPathKit = require('maker.js-pathkit');

// Perform boolean operations using PathKit
const result = await makerPathKit.booleanOperation(model1, model2, 'union');
```

## API

### Maker.js Integration Functions

### `modelToSVGPath(model: IModel, makerjs: any): string`

Convert a Maker.js model to SVG path data string using makerjs.exporter.toSVGPathData.

### `pathToSVGPathData(path: IPath, makerjs: any): string`

Convert a single Maker.js path to SVG path data string.

### `modelToPathKit(model: IModel, makerjs: any): SkPath`

Convert a Maker.js model to a PathKit SkPath object.

### `pathKitToModel(skPath: SkPath, makerjs: any): IModel`

Convert a PathKit SkPath back to a Maker.js model using makerjs.importer.fromSVGPathData.

### `booleanOperation(model1: IModel, model2: IModel, operation: string, makerjs: any): IModel`

Perform boolean operations (union, intersection, difference, xor) on two Maker.js models using PathKit.

### `simplifyModel(model: IModel, makerjs: any): IModel`

Simplify a Maker.js model using PathKit path simplification.

### `requireMakerJs(): any`

Helper function to dynamically load the makerjs module.

### FontKit Integration Functions

### `init(): Promise<void>`

Initialize the PathKit WASM module. Must be called before using other functions.

### `loadFont(fontSource: string | Buffer): Promise<Font>`

Load a font from a file path or buffer. Returns a fontkit Font object.

### `fontGlyphToPath(font: Font, glyphId: number | string, fontSize?: number): SkPath`

Convert a font glyph to a PathKit path. glyphId can be a glyph ID number or a character string. Default fontSize is 72.

### `textToPathKitPaths(font: Font, text: string, fontSize?: number): Array<{path, x, y, glyph}>`

Convert a text string to an array of PathKit paths (one per character) with positioning information.

### `textToPathKit(font: Font, text: string, fontSize?: number): SkPath`

Convert a text string to a single combined PathKit path with all characters merged.

### `booleanOperation(model1: IModel, model2: IModel, operation: string, makerjs: any): IModel`

Perform boolean operations on two Maker.js models using PathKit for accurate results.

## License

Apache-2.0

## Credits

This package is part of the [Maker.js](https://maker.js.org) ecosystem.
