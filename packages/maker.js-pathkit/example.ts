/**
 * Example usage of maker.js-pathkit with fontkit and makerjs integration
 */

// Import the shim
import * as makerPathKit from './src/index';

async function exampleBooleanOps() {
    console.log('=== Boolean Operations Example (Direct PathKit) ===');
    
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

async function exampleMakerJsIntegration() {
    console.log('\n=== Maker.js Integration Example ===');
    
    try {
        // Load makerjs
        const makerjs = makerPathKit.requireMakerJs();
        console.log('MakerJs loaded successfully');
        
        // Create some Maker.js models
        const model1 = new makerjs.models.Rectangle(100, 100);
        const model2 = new makerjs.models.Circle(60);
        model2.origin = [50, 50];
        
        console.log('Model 1 (Rectangle):', JSON.stringify(model1, null, 2));
        console.log('Model 2 (Circle):', JSON.stringify(model2, null, 2));
        
        // Perform boolean union using PathKit
        console.log('\nPerforming boolean union on Maker.js models...');
        const unionModel = makerPathKit.booleanOperation(model1, model2, 'union', makerjs);
        console.log('Union result:', JSON.stringify(unionModel, null, 2));
        
        // Perform boolean intersection
        console.log('\nPerforming boolean intersection...');
        const intersectModel = makerPathKit.booleanOperation(model1, model2, 'intersect', makerjs);
        console.log('Intersection result:', JSON.stringify(intersectModel, null, 2));
        
        // Perform boolean difference
        console.log('\nPerforming boolean difference...');
        const differenceModel = makerPathKit.booleanOperation(model1, model2, 'difference', makerjs);
        console.log('Difference result:', JSON.stringify(differenceModel, null, 2));
        
        // Export to SVG
        const svg = makerjs.exporter.toSVG(unionModel);
        console.log('\nExported SVG (first 200 chars):', svg.substring(0, 200) + '...');
        
        console.log('Maker.js integration example completed!');
    } catch (error) {
        console.error('Maker.js integration example error:', error);
        console.log('Note: This example requires makerjs to be installed');
    }
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
        await exampleMakerJsIntegration();
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


