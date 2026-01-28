/**
 * maker.js-pathkit
 * 
 * Shim for integrating Maker.js with Skia PathKit
 * Provides utilities for font ingestion and boolean operations
 */

import PathKitInit from 'pathkit-wasm';

// Re-export integration functions
export * from './makerjs-integration';
export * from './fontkit-integration';

let PathKit: any = null;

/**
 * Initialize the PathKit WASM module
 * Must be called before using other functions in this module
 */
export async function init(): Promise<void> {
    if (PathKit) {
        return; // Already initialized
    }
    
    try {
        PathKit = await PathKitInit({
            locateFile: (file: string) => {
                // Default location for the WASM file
                return `node_modules/pathkit-wasm/bin/${file}`;
            }
        });
    } catch (error) {
        throw new Error(`Failed to initialize PathKit: ${error}`);
    }
}

/**
 * Check if PathKit has been initialized
 */
export function isInitialized(): boolean {
    return PathKit !== null;
}

/**
 * Get the PathKit instance
 * Throws an error if PathKit has not been initialized
 */
export function getPathKit(): any {
    if (!PathKit) {
        throw new Error('PathKit has not been initialized. Call init() first.');
    }
    return PathKit;
}

/**
 * Convert a PathKit SkPath to SVG path data string
 */
export function pathToSVGString(skPath: any): string {
    return skPath.toSVGString();
}

/**
 * Create a PathKit path from SVG path data
 */
export function pathFromSVGString(svgPath: string): any {
    const pk = getPathKit();
    return pk.FromSVGString(svgPath);
}

/**
 * Perform boolean operation on two PathKit paths
 * 
 * @param path1 First PathKit path
 * @param path2 Second PathKit path
 * @param operation Operation type: 'union', 'intersect', 'difference', 'xor'
 * @returns Result PathKit path, or null if operation fails
 */
export function booleanOp(path1: any, path2: any, operation: string): any {
    const pk = getPathKit();
    
    let opType;
    switch (operation.toLowerCase()) {
        case 'union':
            opType = pk.PathOp.UNION;
            break;
        case 'intersect':
        case 'intersection':
            opType = pk.PathOp.INTERSECT;
            break;
        case 'difference':
        case 'subtract':
            opType = pk.PathOp.DIFFERENCE;
            break;
        case 'xor':
            opType = pk.PathOp.XOR;
            break;
        default:
            throw new Error(`Unknown boolean operation: ${operation}`);
    }
    
    const result = pk.MakeFromOp(path1, path2, opType);
    if (!result) {
        throw new Error(`Boolean operation ${operation} failed or produced empty result`);
    }
    return result;
}

/**
 * Simplify a PathKit path
 */
export function simplifyPath(path: any): any {
    const simplified = path.copy();
    simplified.simplify();
    return simplified;
}

/**
 * Get the bounds of a PathKit path
 */
export function getPathBounds(path: any): { left: number; top: number; right: number; bottom: number } {
    const bounds = path.getBounds();
    return {
        left: bounds[0],
        top: bounds[1],
        right: bounds[2],
        bottom: bounds[3]
    };
}

/**
 * Convert font glyph to PathKit path
 * @deprecated Use fontGlyphToPath from fontkit-integration module instead
 * 
 * @param fontData Font data buffer
 * @param glyphId Glyph ID to convert
 * @returns PathKit path representing the glyph
 */
export async function fontGlyphToPathLegacy(fontData: ArrayBuffer, glyphId: number): Promise<any> {
    throw new Error('fontGlyphToPathLegacy is deprecated. Use loadFont() and fontGlyphToPath() from fontkit-integration module instead.');
}

/**
 * Clean up PathKit resources
 */
export function dispose(): void {
    if (PathKit) {
        // PathKit cleanup if needed
        PathKit = null;
    }
}
