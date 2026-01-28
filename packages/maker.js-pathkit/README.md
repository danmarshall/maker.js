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

// Convert a font glyph to a PathKit path (placeholder)
const path = await makerPathKit.fontGlyphToPath(fontData, glyphId);

// Convert the PathKit path to SVG for use with Maker.js
const svg = makerPathKit.pathToSVGString(path);
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

### `fontGlyphToPath(fontData: ArrayBuffer, glyphId: number): Promise<any>`

Convert a font glyph to a PathKit path. (Note: This is a placeholder - full implementation requires integration with a font parsing library)

### `booleanOperation(model1: any, model2: any, operation: string): Promise<any>`

Perform boolean operations (union, intersection, difference, xor) on two Maker.js models.

## License

Apache-2.0

## Credits

This package is part of the [Maker.js](https://maker.js.org) ecosystem.
