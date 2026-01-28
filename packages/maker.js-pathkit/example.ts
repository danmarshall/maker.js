/**
 * Example usage of maker.js-pathkit with fontkit integration
 */

// Import the shim
import * as makerPathKit from './src/index';

async function exampleBooleanOps() {
    console.log('=== Boolean Operations Example ===');
    
    // Initialize PathKit
    console.log('Initializing PathKit...');
    await makerPathKit.init();
    console.log('PathKit initialized!');

    // Create some PathKit paths from SVG
    const path1 = makerPathKit.pathFromSVGString('M 0 0 L 100 0 L 100 100 L 0 100 Z');
    const path2 = makerPathKit.pathFromSVGString('M 50 50 L 150 50 L 150 150 L 50 150 Z');

    // Perform boolean union
    console.log('Performing boolean union...');
    const unionPath = makerPathKit.booleanOp(path1, path2, 'union');
    console.log('Union result:', makerPathKit.pathToSVGString(unionPath));

    // Get bounds
    const bounds = makerPathKit.getPathBounds(unionPath);
    console.log('Bounds:', bounds);

    // Clean up
    path1.delete();
    path2.delete();
    unionPath.delete();

    console.log('Boolean operations example completed!');
}

async function exampleFontIngestion() {
    console.log('\n=== Font Ingestion Example ===');
    
    try {
        // Note: This example requires a font file to be available
        // For demonstration purposes, we'll show the API usage
        
        console.log('Font ingestion API usage:');
        console.log('1. await makerPathKit.loadFont("path/to/font.ttf")');
        console.log('2. makerPathKit.fontGlyphToPath(font, "A", 72)');
        console.log('3. makerPathKit.textToPathKit(font, "Hello", 72)');
        
        // Uncomment below if you have a font file available:
        /*
        const font = await makerPathKit.loadFont('/path/to/your/font.ttf');
        
        // Convert single character
        const glyphPath = makerPathKit.fontGlyphToPath(font, 'A', 100);
        console.log('Glyph A path:', makerPathKit.pathToSVGString(glyphPath));
        glyphPath.delete();
        
        // Convert text to individual paths
        const textPaths = makerPathKit.textToPathKitPaths(font, 'Hi', 72);
        console.log(`Generated ${textPaths.length} glyph paths`);
        textPaths.forEach(({ path, x, y }) => {
            console.log(`  Glyph at (${x.toFixed(2)}, ${y.toFixed(2)})`);
            path.delete();
        });
        
        // Convert text to combined path
        const combinedPath = makerPathKit.textToPathKit(font, 'Test', 72);
        console.log('Combined text path:', makerPathKit.pathToSVGString(combinedPath));
        combinedPath.delete();
        */
        
        console.log('Font ingestion example completed!');
    } catch (error) {
        console.error('Font ingestion example error:', error);
    }
}

async function main() {
    try {
        await exampleBooleanOps();
        await exampleFontIngestion();
        console.log('\nAll examples completed successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run examples
if (require.main === module) {
    main().catch(console.error);
}

