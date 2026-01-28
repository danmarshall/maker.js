/**
 * Font ingestion using fontkit and PathKit
 */

import * as pathkit from './index';
import type { Font } from 'fontkit';

/**
 * Convert fontkit glyph path commands to PathKit path
 * 
 * @param glyphPath Fontkit glyph path object
 * @param scale Scale factor (fontSize / unitsPerEm)
 * @returns PathKit path
 */
export function fontkitGlyphPathToPathKit(glyphPath: any, scale: number = 1): any {
    const pk = pathkit.getPathKit();
    const skPath = new pk.SkPath();
    
    if (!glyphPath || !glyphPath.commands) {
        return skPath;
    }
    
    // Process fontkit path commands
    for (const cmd of glyphPath.commands) {
        switch (cmd.command) {
            case 'moveTo':
                skPath.moveTo(cmd.args[0] * scale, -cmd.args[1] * scale);
                break;
            case 'lineTo':
                skPath.lineTo(cmd.args[0] * scale, -cmd.args[1] * scale);
                break;
            case 'quadraticCurveTo':
                skPath.quadTo(
                    cmd.args[0] * scale, -cmd.args[1] * scale,
                    cmd.args[2] * scale, -cmd.args[3] * scale
                );
                break;
            case 'bezierCurveTo':
                skPath.cubicTo(
                    cmd.args[0] * scale, -cmd.args[1] * scale,
                    cmd.args[2] * scale, -cmd.args[3] * scale,
                    cmd.args[4] * scale, -cmd.args[5] * scale
                );
                break;
            case 'closePath':
                skPath.close();
                break;
        }
    }
    
    return skPath;
}

/**
 * Convert a fontkit font glyph to PathKit path
 * 
 * @param font Fontkit font object
 * @param glyphId Glyph ID or character string
 * @param fontSize Font size in units (default 72)
 * @returns PathKit path representing the glyph
 */
export function fontGlyphToPath(font: any, glyphId: number | string, fontSize: number = 72): any {
    if (!pathkit.isInitialized()) {
        throw new Error('PathKit must be initialized before converting font glyphs');
    }
    
    // Get the glyph
    let glyph: any;
    if (typeof glyphId === 'string') {
        // If glyphId is a string, get glyph for that character
        const glyphRun = font.layout(glyphId);
        if (glyphRun.glyphs.length === 0) {
            throw new Error(`No glyph found for character: ${glyphId}`);
        }
        glyph = glyphRun.glyphs[0];
    } else {
        // If glyphId is a number, get glyph by ID
        glyph = font.getGlyph(glyphId);
    }
    
    if (!glyph) {
        throw new Error(`Glyph not found: ${glyphId}`);
    }
    
    // Calculate scale
    const scale = fontSize / font.unitsPerEm;
    
    // Convert glyph path to PathKit
    return fontkitGlyphPathToPathKit(glyph.path, scale);
}

/**
 * Convert a string of text to PathKit paths (one path per character)
 * 
 * @param font Fontkit font object
 * @param text Text string to convert
 * @param fontSize Font size in units (default 72)
 * @returns Array of PathKit paths with positioning info
 */
export function textToPathKitPaths(font: any, text: string, fontSize: number = 72): Array<{ path: any, x: number, y: number, glyph: any }> {
    if (!pathkit.isInitialized()) {
        throw new Error('PathKit must be initialized before converting text');
    }
    
    const run = font.layout(text);
    const scale = fontSize / font.unitsPerEm;
    const results: Array<{ path: any, x: number, y: number, glyph: any }> = [];
    let currentX = 0;
    
    for (let i = 0; i < run.glyphs.length; i++) {
        const glyph = run.glyphs[i];
        const position = run.positions[i];
        
        const glyphX = currentX + (position.xOffset || 0) * scale;
        const glyphY = (position.yOffset || 0) * scale;
        
        const path = fontkitGlyphPathToPathKit(glyph.path, scale);
        
        // Apply position offset to the path
        const pk = pathkit.getPathKit();
        const matrix = pk.SkMatrix.translated(glyphX, -glyphY);
        path.transform(matrix);
        
        results.push({
            path,
            x: glyphX,
            y: glyphY,
            glyph
        });
        
        currentX += (position.xAdvance || 0) * scale;
    }
    
    return results;
}

/**
 * Convert a string of text to a single combined PathKit path
 * 
 * @param font Fontkit font object
 * @param text Text string to convert
 * @param fontSize Font size in units (default 72)
 * @returns Single PathKit path with all characters combined
 */
export function textToPathKit(font: any, text: string, fontSize: number = 72): any {
    const paths = textToPathKitPaths(font, text, fontSize);
    
    if (paths.length === 0) {
        const pk = pathkit.getPathKit();
        return new pk.SkPath();
    }
    
    // Combine all paths into one
    const pk = pathkit.getPathKit();
    let combined = paths[0].path;
    
    for (let i = 1; i < paths.length; i++) {
        const next = pk.MakeFromOp(combined, paths[i].path, pk.PathOp.UNION);
        if (i > 1) {
            combined.delete(); // Clean up intermediate results
        }
        combined = next;
        paths[i].path.delete(); // Clean up source paths
    }
    
    return combined;
}

/**
 * Load a font from a file path or buffer
 * 
 * @param fontSource File path string or Buffer containing font data
 * @returns Fontkit font object (or first font if a collection)
 */
export async function loadFont(fontSource: string | Buffer): Promise<Font> {
    const fontkit = await import('fontkit');
    
    let result: Font | any;
    if (typeof fontSource === 'string') {
        // Load from file path
        result = fontkit.openSync(fontSource);
    } else {
        // Load from buffer
        result = fontkit.create(fontSource);
    }
    
    // If it's a font collection, return the first font
    if (result && typeof result.getFont === 'function') {
        return result.getFont(0);
    }
    
    return result;
}
