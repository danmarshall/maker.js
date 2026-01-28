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

### Font Ingestion

```javascript
const makerPathKit = require('maker.js-pathkit');
const makerjs = require('makerjs');

// Initialize PathKit
await makerPathKit.init();

// Convert a font glyph to a Maker.js model
const model = await makerPathKit.fontGlyphToModel(fontData, glyphId);

// Export as SVG
const svg = makerjs.exporter.toSVG(model);
```

### Boolean Operations

```javascript
const makerPathKit = require('maker.js-pathkit');

// Perform boolean operations using PathKit
const result = await makerPathKit.booleanOperation(model1, model2, 'union');
```

## API

### `init(): Promise<void>`

Initialize the PathKit WASM module. Must be called before using other functions.

### `fontGlyphToModel(fontData: ArrayBuffer, glyphId: number): Promise<IModel>`

Convert a font glyph to a Maker.js model using PathKit.

### `booleanOperation(model1: IModel, model2: IModel, operation: string): Promise<IModel>`

Perform boolean operations (union, intersection, difference, xor) on two Maker.js models.

## License

Apache-2.0

## Credits

This package is part of the [Maker.js](https://maker.js.org) ecosystem.
