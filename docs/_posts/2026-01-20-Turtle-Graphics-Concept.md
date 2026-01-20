---
layout: post
title: Turtle Graphics - Feature Concept
---

# Turtle Graphics Concept

This document explores the idea of implementing **Turtle Graphics** in Maker.js. This is a conceptual proposal to discuss and refine the feature set before implementation.

## Overview

Turtle graphics is a drawing paradigm where a virtual "turtle" moves around the canvas, leaving a trail behind it. This metaphor, popularized by the Logo programming language, provides an intuitive way to create complex geometric drawings through simple, sequential commands.

## Core Concept

A Turtle in Maker.js would provide an alternative, imperative API for creating drawings, complementing the existing declarative model approach. The turtle would maintain state (position, heading/angle) and translate movement commands into Maker.js paths.

### Primary Use Case: Text Model Glyph Creation

One of the key applications for a Turtle would be in the Text model for creating glyphs. The Text model already processes font glyph commands (like `moveTo`, `lineTo`, `bezierCurveTo`, `quadraticCurveTo`, `closePath`) from font files. A Turtle could provide a programmatic way to create custom glyphs or modify existing ones using the same command-based approach.

## Key Features

### 1. Implicit Chain Creation

**A turtle implicitly makes chains.**

When a turtle moves with its "pen down," it naturally creates a sequence of connected paths. These paths would automatically form chains since:
- Each movement command creates a path segment
- Consecutive movements share endpoints
- The resulting structure is already a connected sequence

**Example conceptual API:**
```javascript
var turtle = new makerjs.models.Turtle();

turtle.forward(10);  // Creates a line path
turtle.right(90);    // Rotates heading
turtle.forward(5);   // Creates another line path connected to the first

// Result: A chain with two connected line segments
```

The turtle's output would be a standard Maker.js model containing paths that naturally form chains, making them compatible with all existing chain operations (filleting, dogbone joints, exporting, etc.).

### 2. Command Object API

**A turtle should accept command objects, similar to how the Text model processes glyph commands.**

Following the pattern established in the Text model, which processes font glyph command objects, the Turtle would accept command objects as its primary API. This provides a clean, consistent approach without the need for dual APIs.

**Command Objects to Support:**
- `{ command: 'moveTo', args: [x, y] }` - Move without drawing
- `{ command: 'lineTo', args: [x, y] }` - Draw a line
- `{ command: 'bezierCurveTo', args: [x1, y1, x2, y2, x, y] }` - Draw a cubic Bezier curve
- `{ command: 'quadraticCurveTo', args: [x1, y1, x, y] }` - Draw a quadratic Bezier curve
- `{ command: 'closePath', args: [] }` - Close the current path

Additionally, turtle-specific commands could be supported:
- `{ command: 'forward', args: [distance] }` - Move forward in current heading
- `{ command: 'back', args: [distance] }` - Move backward
- `{ command: 'left', args: [angle] }` - Turn left (degrees)
- `{ command: 'right', args: [angle] }` - Turn right (degrees)

**Example conceptual API:**
```javascript
var turtle = new makerjs.models.Turtle();

// Execute commands one at a time
turtle.execute({ command: 'moveTo', args: [0, 0] });
turtle.execute({ command: 'lineTo', args: [10, 0] });
turtle.execute({ command: 'lineTo', args: [10, 10] });
turtle.execute({ command: 'closePath', args: [] });

// Or execute an array of commands
turtle.executeAll([
  { command: 'moveTo', args: [0, 0] },
  { command: 'lineTo', args: [10, 0] },
  { command: 'bezierCurveTo', args: [15, 0, 15, 5, 10, 10] },
  { command: 'closePath', args: [] }
]);

// Turtle-specific commands work alongside path commands
turtle.executeAll([
  { command: 'forward', args: [10] },
  { command: 'right', args: [90] },
  { command: 'forward', args: [10] }
]);
```

**String Parsing as a Convenience:**

While command objects are the primary API, accepting SVG path data strings could be a useful convenience feature:

```javascript
// Optional convenience: parse SVG path string into command objects
turtle.parsePathData('M 0,0 L 10,0 L 10,10 Z');
```

This would internally convert the string to command objects before execution, maintaining a single execution path while providing ergonomic benefits for certain use cases.

**Open Questions:**
- Should string parsing be included as a convenience, or is it too problematic (parsing complexity, relative vs. absolute coordinates)?
- Should turtle-specific commands (forward, left, right) be separate from path commands, or unified under the same command object structure?

### 3. Self-Intersection Detection and Cleanup

**A turtle might remember when it crossed its own chain and can later "clean up" crossings to ensure closed geometry.**

This advanced feature would enable the turtle to:
1. **Track intersections** as paths are drawn (probably while drawing each segment for efficiency)
2. **Remember intersection points** where the current segment crosses any previous segment
3. **Provide cleanup utilities** to resolve crossings into proper closed geometries

**Use Cases:**
- Drawing complex shapes that need to be "closed" at intersections
- Creating figures-of-eight or other self-crossing patterns
- Automatically detecting and creating proper geometric unions/intersections

**Conceptual Implementation Considerations:**

**During Drawing:**
- For each new segment, check intersection with all previous segments in the chain
- Store intersection points with metadata (which segments, position along each segment)
- Minimal performance impact since check happens during segment creation

**Cleanup Options:**
```javascript
var turtle = new makerjs.models.Turtle({ trackIntersections: true });

// Draw a complex path that crosses itself
turtle.forward(10);
turtle.right(60);
turtle.forward(15);
turtle.right(120);
turtle.forward(15);
// ... creates a self-crossing pattern

// Later, clean up intersections:
var cleanedModel = turtle.cleanupIntersections({
  mode: 'split',  // Split chains at intersections
  // or
  mode: 'close',  // Create closed polygons from loops
});
```

**Advanced Cleanup Modes:**
- **Split**: Break the chain at each intersection point, creating multiple chains
- **Close**: Detect loops and create closed polygons
- **Union**: Create a boolean union of all enclosed areas
- **Outer**: Keep only the outer boundary

**Technical Challenges:**
- Efficient intersection detection (using spatial indexing like R-tree or KD-tree)
- Determining which cleanup strategy is appropriate
- Handling edge cases (tangent intersections, multiple intersections at same point)
- Maintaining proper winding order for closed paths

## Integration with Existing Features

The Turtle model would integrate seamlessly with existing Maker.js features:

- **Chains**: Turtle output is inherently chain-based
- **Boolean operations**: Cleaned-up turtle drawings can participate in unions, intersections, subtractions
- **Export**: Works with all existing exporters (DXF, SVG, PDF, etc.)
- **Transformations**: Turtle models can be scaled, rotated, mirrored like any other model
- **Layers**: Turtle can draw on specific layers
- **Fillets and dogbones**: Apply to turtle-generated chains
- **Text model**: Use Turtle to programmatically create or modify glyphs using the same command object pattern

## Potential API Design

```javascript
// Basic turtle with options
var turtle = new makerjs.models.Turtle(options);

// Options might include:
// - origin: [x, y] - starting position
// - heading: degrees - initial angle (0 = right, 90 = up)
// - penDown: boolean - start with pen up or down
// - trackIntersections: boolean - enable self-intersection detection
// - layer: string - layer name for paths

// Execute a single command object
turtle.execute({ command: 'moveTo', args: [0, 0] });
turtle.execute({ command: 'lineTo', args: [10, 0] });
turtle.execute({ command: 'forward', args: [10] });
turtle.execute({ command: 'right', args: [90] });

// Execute multiple command objects
turtle.executeAll([
  { command: 'moveTo', args: [0, 0] },
  { command: 'lineTo', args: [10, 0] },
  { command: 'bezierCurveTo', args: [15, 0, 15, 5, 10, 10] },
  { command: 'closePath', args: [] }
]);

// Optional convenience method for SVG path strings
turtle.parsePathData('M 0,0 L 10,0 L 10,10 Z');

// Get current state
var pos = turtle.getPosition();  // [x, y]
var heading = turtle.getHeading();  // degrees
var isPenDown = turtle.isPenDown();

// Access the underlying model
var model = turtle.toModel();  // Returns standard Maker.js model

// Intersection handling
var intersections = turtle.getIntersections();
var cleanedModel = turtle.cleanupIntersections(options);
```

## Examples

### Example 1: Simple Square with Command Objects
```javascript
var turtle = new makerjs.models.Turtle();

// Draw a square using command objects
turtle.executeAll([
  { command: 'forward', args: [10] },
  { command: 'right', args: [90] },
  { command: 'forward', args: [10] },
  { command: 'right', args: [90] },
  { command: 'forward', args: [10] },
  { command: 'right', args: [90] },
  { command: 'forward', args: [10] }
]);
// Creates a closed chain forming a square
```

### Example 2: Star Pattern with Intersection Tracking
```javascript
var turtle = new makerjs.models.Turtle({ trackIntersections: true });

// Draw a 5-pointed star using command objects
var commands = [];
for (var i = 0; i < 5; i++) {
  commands.push({ command: 'forward', args: [20] });
  commands.push({ command: 'right', args: [144] });  // 180 - 36 degrees
}
turtle.executeAll(commands);

// The star crosses itself, intersections are tracked
var intersections = turtle.getIntersections();
// intersections contains 5 points where lines cross

// Clean up to get proper closed regions
var starModel = turtle.cleanupIntersections({ mode: 'close' });
// Creates separate polygons for the inner pentagon and outer points
```

### Example 3: Path Commands for Glyph Creation
```javascript
var turtle = new makerjs.models.Turtle();

// Create a custom glyph using path command objects
// (similar to how Text model processes font glyph commands)
turtle.executeAll([
  { command: 'moveTo', args: [0, 0] },
  { command: 'lineTo', args: [10, 0] },
  { command: 'bezierCurveTo', args: [15, 0, 15, 5, 10, 10] },
  { command: 'lineTo', args: [0, 10] },
  { command: 'closePath', args: [] }
]);

// Optional: parse SVG path string as a convenience
turtle.parsePathData('M 0,0 L 10,0 C 15,0 15,5 10,10 L 0,10 Z');
```

## Open Questions

1. **Command Object Structure**: Should turtle-specific commands (forward, left, right) use the same command object structure as path commands (moveTo, lineTo, etc.), or should they be separate for better ergonomics?

2. **SVG Path String Parsing**: Is string parsing (e.g., `parsePathData('M 0,0 L 10,0 Z')`) worth including as a convenience feature despite the complexity, or should we stick to command objects only?

3. **Intersection Detection**: 
   - Should intersection detection be always-on or opt-in?
   - What's the performance impact for complex drawings?
   - Should we provide real-time feedback about intersections?

4. **Cleanup Strategies**: Which cleanup modes are most useful? Should this be guided (user chooses) or automatic?

5. **State Management**: Should turtles maintain undo/redo history? Should they support saving/loading state?

6. **Multiple Turtles**: Should we support multiple turtles in the same drawing, potentially creating different chains simultaneously?

7. **Arc Handling**: Should we provide an `arc` command object (e.g., `{ command: 'arc', args: [radius, angle] }`), or rely on bezierCurveTo for curves?

## Benefits

- **Consistent API**: Command objects align with existing Text model pattern
- **Intuitive**: Easy to learn and teach, especially for glyph creation
- **Procedural Drawing**: Natural for algorithmic/generative art
- **Chain-First**: Output is inherently suitable for CNC/laser cutting
- **Complementary**: Adds a procedural approach alongside the declarative model approach
- **Text Model Integration**: Can be used to programmatically create or modify glyphs
- **Educational**: Great for teaching programming and geometry

## Next Steps

Before implementation, we should gather feedback on:
- Which features are most valuable?
- What should the API look like?
- Are there use cases we haven't considered?
- What performance concerns need to be addressed?

This document serves as a starting point for discussion. Please provide feedback and suggestions!

---

*This is a conceptual document and does not represent implemented functionality.*
