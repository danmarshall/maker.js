/**
 * Example usage of maker.js-pathkit
 */

// Import the shim
import * as makerPathKit from './src/index';

async function example() {
    try {
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

        console.log('Example completed successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run example
if (require.main === module) {
    example().catch(console.error);
}
