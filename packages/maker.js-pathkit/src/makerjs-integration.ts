/**
 * Integration helpers for converting between Maker.js and PathKit
 */

import * as pathkit from './index';

// Import MakerJs types
type IModel = any; // Will be typed properly when makerjs is imported
type IPath = any;
type IPoint = any;

/**
 * Convert a Maker.js path to SVG path data string
 * 
 * @param path Maker.js path object
 * @param makerjs MakerJs module reference
 * @returns SVG path data string
 */
export function pathToSVGPathData(path: IPath, makerjs: any): string {
    if (!makerjs || !makerjs.exporter || !makerjs.exporter.toSVGPathData) {
        throw new Error('MakerJs module with exporter required');
    }
    
    // Create a temporary model with just this path
    const tempModel: IModel = {
        paths: {
            temp: path
        }
    };
    
    return makerjs.exporter.toSVGPathData(tempModel, false);
}

/**
 * Convert a Maker.js model to SVG path data string
 * This uses makerjs.exporter.toSVGPathData to extract path data
 * 
 * @param model Maker.js model
 * @param makerjs MakerJs module reference
 * @returns SVG path data string
 */
export function modelToSVGPath(model: IModel, makerjs: any): string {
    if (!makerjs || !makerjs.exporter || !makerjs.exporter.toSVGPathData) {
        throw new Error('MakerJs module with exporter required');
    }
    
    // Get SVG path data from model
    const pathData = makerjs.exporter.toSVGPathData(model, false);
    
    if (typeof pathData !== 'string') {
        throw new Error('Expected single SVG path data string, got layered object');
    }
    
    return pathData;
}

/**
 * Convert PathKit SkPath to Maker.js model
 * This converts the PathKit path to SVG path data, then creates a model with an SVG path import
 * 
 * @param skPath PathKit SkPath object
 * @param makerjs MakerJs module reference
 * @returns Maker.js model
 */
export function pathKitToModel(skPath: any, makerjs: any): IModel {
    if (!makerjs || !makerjs.importer || !makerjs.importer.fromSVGPathData) {
        throw new Error('MakerJs module with importer required');
    }
    
    // Convert PathKit path to SVG path data
    const svgPathData = pathkit.pathToSVGString(skPath);
    
    // Import the SVG path data into a Maker.js model
    const model = makerjs.importer.fromSVGPathData(svgPathData);
    
    return model || { paths: {} };
}

/**
 * Convert Maker.js model to PathKit SkPath
 * 
 * @param model Maker.js model
 * @param makerjs MakerJs module reference
 * @returns PathKit SkPath
 */
export function modelToPathKit(model: IModel, makerjs: any): any {
    if (!pathkit.isInitialized()) {
        throw new Error('PathKit must be initialized before converting models');
    }
    
    // Convert model to SVG path data
    const svgPathData = modelToSVGPath(model, makerjs);
    
    // Convert SVG path data to PathKit path
    return pathkit.pathFromSVGString(svgPathData);
}

/**
 * Perform boolean operation on two Maker.js models using PathKit
 * 
 * @param model1 First Maker.js model
 * @param model2 Second Maker.js model
 * @param operation Boolean operation: 'union', 'intersect', 'difference', 'xor'
 * @param makerjs MakerJs module reference
 * @returns Result model
 */
export function booleanOperation(model1: IModel, model2: IModel, operation: string, makerjs: any): IModel {
    if (!pathkit.isInitialized()) {
        throw new Error('PathKit must be initialized before performing boolean operations');
    }
    
    if (!makerjs) {
        throw new Error('MakerJs module required for boolean operations');
    }
    
    // Convert models to PathKit paths
    const path1 = modelToPathKit(model1, makerjs);
    const path2 = modelToPathKit(model2, makerjs);
    let result = null;
    
    try {
        // Perform boolean operation
        result = pathkit.booleanOp(path1, path2, operation);
        
        // Convert back to Maker.js model
        return pathKitToModel(result, makerjs);
    } finally {
        // Clean up PathKit objects
        path1.delete();
        path2.delete();
        if (result) {
            result.delete();
        }
    }
}

/**
 * Simplify a Maker.js model using PathKit
 * 
 * @param model Maker.js model to simplify
 * @param makerjs MakerJs module reference
 * @returns Simplified model
 */
export function simplifyModel(model: IModel, makerjs: any): IModel {
    if (!pathkit.isInitialized()) {
        throw new Error('PathKit must be initialized before simplifying');
    }
    
    if (!makerjs) {
        throw new Error('MakerJs module required for simplification');
    }
    
    // Convert model to PathKit path
    const path = modelToPathKit(model, makerjs);
    let simplified = null;
    
    try {
        // Simplify
        simplified = pathkit.simplifyPath(path);
        
        // Convert back to Maker.js model
        return pathKitToModel(simplified, makerjs);
    } finally {
        // Clean up PathKit objects
        path.delete();
        if (simplified) {
            simplified.delete();
        }
    }
}

/**
 * Helper function to require makerjs module
 * This is useful for environments where makerjs needs to be dynamically loaded
 * 
 * @returns MakerJs module
 */
export function requireMakerJs(): any {
    try {
        return require('makerjs');
    } catch (error) {
        throw new Error('Could not load makerjs module. Ensure makerjs is installed as a dependency.');
    }
}

