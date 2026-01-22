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

### 2. Ergonomic API with Command Object Support

**The turtle should provide direct method calls for ergonomic use, while also supporting command objects for batch operations (like processing font glyphs).**

The primary API uses direct method calls to avoid verbose boilerplate, making the turtle easy and natural to use:

**Direct Method API:**
```javascript
var turtle = new makerjs.models.Turtle();

// Simple, direct method calls
turtle.moveTo(0, 0);
turtle.lineTo(10, 0);
turtle.lineTo(10, 10);
turtle.closePath();

// Turtle-specific movement methods
turtle.forward(10);
turtle.right(90);
turtle.back(5);
turtle.left(45);

// Curve methods
turtle.bezierCurveTo(15, 0, 15, 5, 10, 10);
turtle.quadraticCurveTo(5, 5, 0, 10);
```

**Command Object Support for Batch Operations:**

When working with arrays of commands (such as from font glyphs or stored paths), command objects provide a convenient format:

```javascript
// Execute an array of command objects (e.g., from a font glyph)
var glyphCommands = [
  { command: 'moveTo', args: [0, 0] },
  { command: 'lineTo', args: [10, 0] },
  { command: 'bezierCurveTo', args: [15, 0, 15, 5, 10, 10] },
  { command: 'closePath', args: [] }
];

turtle.executeAll(glyphCommands);
```

**Why Both?**

- **Direct methods**: Ergonomic for manual/interactive use, no boilerplate
- **Command objects**: Essential for Text model integration and processing pre-existing command arrays
- **Single implementation**: Direct methods internally create and execute command objects

**String Parsing as Optional Convenience:**

SVG path data string parsing could be included as an optional convenience:

```javascript
// Optional: parse SVG path string
turtle.parsePathData('M 0,0 L 10,0 L 10,10 Z');
```

**Open Questions:**
- Should string parsing be included, or is it too complex (relative vs. absolute coordinates, arc parameters)?
- Should there be a method to retrieve the command history as an array of command objects?

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

// Direct method calls (primary API)
turtle.moveTo(0, 0);
turtle.lineTo(10, 0);
turtle.lineTo(10, 10);
turtle.closePath();

// Turtle-specific methods
turtle.forward(10);
turtle.back(5);
turtle.right(90);
turtle.left(45);

// Curve methods
turtle.bezierCurveTo(15, 0, 15, 5, 10, 10);
turtle.quadraticCurveTo(5, 5, 0, 10);

// Pen control
turtle.penUp();
turtle.penDown();

// Execute command objects (for batch operations like font glyphs)
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

### Example 1: Simple Square with Direct Methods
```javascript
var turtle = new makerjs.models.Turtle();

// Draw a square using direct method calls
for (var i = 0; i < 4; i++) {
  turtle.forward(10);
  turtle.right(90);
}
// Creates a closed chain forming a square
```

### Example 2: Star Pattern with Intersection Tracking
```javascript
var turtle = new makerjs.models.Turtle({ trackIntersections: true });

// Draw a 5-pointed star using direct method calls
for (var i = 0; i < 5; i++) {
  turtle.forward(20);
  turtle.right(144);  // 180 - 36 degrees
}

// The star crosses itself, intersections are tracked
var intersections = turtle.getIntersections();
// intersections contains 5 points where lines cross

// Clean up to get proper closed regions
var starModel = turtle.cleanupIntersections({ mode: 'close' });
// Creates separate polygons for the inner pentagon and outer points
```

### Example 3: Glyph Creation from Command Objects
```javascript
var turtle = new makerjs.models.Turtle();

// Process command objects from a font glyph
// (this is where command objects make sense - batch processing)
var glyphCommands = [
  { command: 'moveTo', args: [0, 0] },
  { command: 'lineTo', args: [10, 0] },
  { command: 'bezierCurveTo', args: [15, 0, 15, 5, 10, 10] },
  { command: 'lineTo', args: [0, 10] },
  { command: 'closePath', args: [] }
];
turtle.executeAll(glyphCommands);

// Or use direct methods for manual drawing
turtle.moveTo(20, 0);
turtle.lineTo(30, 0);
turtle.bezierCurveTo(35, 0, 35, 5, 30, 10);
turtle.lineTo(20, 10);
turtle.closePath();
```

## Concrete Use Case Examples

These examples demonstrate the Turtle API with real-world use cases to evaluate ergonomics and identify the best approach.

### Example A: Lowercase Letter 'u' (Text Model Use Case)

The lowercase 'u' has both straight and curved elements, making it a good test case for font glyph creation. In the Text model, the turtle would receive commands one at a time from font data.

**Scenario: Processing font glyph commands sequentially**

```javascript
// The Text model would call the turtle for each command
var turtle = new makerjs.models.Turtle();

// Start at bottom left
turtle.moveTo(0, 0);

// Draw left stem upward
turtle.lineTo(0, 50);

// Draw top horizontal
turtle.lineTo(10, 50);

// Draw right side down with curve at bottom
turtle.lineTo(10, 15);

// Quadratic curve for the bottom-right rounded corner
// Control point at (10, 5), end point at (20, 5)
turtle.quadraticCurveTo(10, 5, 20, 5);

// Draw bottom horizontal
turtle.lineTo(30, 5);

// Draw right stem upward
turtle.lineTo(30, 50);

// Top right
turtle.lineTo(40, 50);

// Draw down
turtle.lineTo(40, 5);

// Curve bottom-right corner
turtle.quadraticCurveTo(40, -5, 30, -5);

// Bottom stroke
turtle.lineTo(10, -5);

// Curve bottom-left corner  
turtle.quadraticCurveTo(0, -5, 0, 5);

// Close the path
turtle.closePath();

// Result: A complete 'u' glyph ready for Text model
var glyphModel = turtle.toModel();
```

**Alternative: Using command objects (as Text model receives from fonts)**

```javascript
var turtle = new makerjs.models.Turtle();

// Text model would pass an array of commands from the font
var uGlyphCommands = [
  { command: 'moveTo', args: [0, 0] },
  { command: 'lineTo', args: [0, 50] },
  { command: 'lineTo', args: [10, 50] },
  { command: 'lineTo', args: [10, 15] },
  { command: 'quadraticCurveTo', args: [10, 5, 20, 5] },
  { command: 'lineTo', args: [30, 5] },
  { command: 'lineTo', args: [30, 50] },
  { command: 'lineTo', args: [40, 50] },
  { command: 'lineTo', args: [40, 5] },
  { command: 'quadraticCurveTo', args: [40, -5, 30, -5] },
  { command: 'lineTo', args: [10, -5] },
  { command: 'quadraticCurveTo', args: [0, -5, 0, 5] },
  { command: 'closePath', args: [] }
];

// Process all commands at once
turtle.executeAll(uGlyphCommands);

// Or process one command at a time (how Text model would do it)
for (var cmd of uGlyphCommands) {
  turtle[cmd.command](...cmd.args);
}
```

**Key Insight for Text Model Integration:** The turtle needs to support both calling patterns:
1. `turtle.moveTo(x, y)` - direct method call
2. `turtle.executeAll(commands)` - batch processing
3. Individual commands via method name lookup - `turtle[cmd.command](...cmd.args)`

### Example B: L-Shaped Part with Rounded Corners

An L-shaped bracket with all rounded corners is cumbersome with the current Maker.js declarative API but natural with a turtle.

**Dimensions:**
- Vertical arm: 100mm tall, 20mm wide
- Horizontal arm: 80mm long, 20mm wide
- All corners: 5mm radius fillets

```javascript
var turtle = new makerjs.models.Turtle();
var cornerRadius = 5;

// Start at bottom-left outer corner
turtle.moveTo(0, 0);

// Go up the left side
turtle.lineTo(0, 100);

// Top-left outer corner - arc turning right
turtle.arc(cornerRadius, 90);  // or arcTo with radius

// Go right along the top
turtle.lineTo(20 - cornerRadius, 100 + cornerRadius);

// Top-right outer corner - arc turning down  
turtle.arc(cornerRadius, 90);

// Go down the outer right side
turtle.lineTo(20, 20 + cornerRadius);

// Inner corner - arc turning right
turtle.arc(cornerRadius, 90);

// Go right along the inner horizontal
turtle.lineTo(80 - cornerRadius, 20);

// Outer bottom-right corner - arc turning down
turtle.arc(cornerRadius, 90);

// Go down to bottom
turtle.lineTo(80, cornerRadius);

// Bottom-right corner - arc turning left
turtle.arc(cornerRadius, 90);

// Go left along the bottom
turtle.lineTo(cornerRadius, 0);

// Bottom-left corner - arc back to start
turtle.arc(cornerRadius, 90);

turtle.closePath();

var lBracket = turtle.toModel();
```

**Alternative API consideration - using relative movements:**

```javascript
var turtle = new makerjs.models.Turtle();
var r = 5;  // corner radius

turtle.moveTo(0, 0);
turtle.lineToRelative(0, 100);     // up
turtle.arcRelative(r, 90);          // curve right
turtle.lineToRelative(20 - 2*r, 0); // right
turtle.arcRelative(r, 90);          // curve down
turtle.lineToRelative(0, -(80 - 2*r)); // down
turtle.arcRelative(r, 90);          // curve right
turtle.lineToRelative(60 - 2*r, 0); // right
turtle.arcRelative(r, 90);          // curve down
turtle.lineToRelative(0, -(20 - 2*r)); // down
turtle.arcRelative(r, 90);          // curve left
turtle.lineToRelative(-(80 - 2*r), 0); // left
turtle.arcRelative(r, 90);          // curve up to close
turtle.closePath();
```

**Even simpler - using forward/turn style:**

```javascript
var turtle = new makerjs.models.Turtle();
turtle.penUp();
turtle.moveTo(0, 0);
turtle.penDown();
turtle.setHeading(90);  // Face up

var r = 5;

// Vertical arm
turtle.forward(100 - r);
turtle.arc(r, 90);       // Turn right with arc
turtle.forward(20 - 2*r);
turtle.arc(r, 90);       // Turn down with arc

// Down to horizontal arm
turtle.forward(80 - 2*r);
turtle.arc(r, 90);       // Turn right with arc

// Horizontal arm
turtle.forward(60 - 2*r);
turtle.arc(r, 90);       // Turn down with arc
turtle.forward(20 - 2*r);
turtle.arc(r, 90);       // Turn left with arc

// Back along bottom
turtle.forward(80 - 2*r);
turtle.arc(r, 90);       // Turn up with arc

turtle.closePath();
```

**Discussion Points:**
1. Should `arc()` method exist, or should users use `bezierCurveTo()` for curves?
2. Are relative movement methods (`lineToRelative`, `arcRelative`) worth adding?
3. Does the forward/turn style (turtle heading) make sense for CAD-style drawings, or just absolute coordinates?
4. How should `arc()` work - by angle turned, or by absolute angle, or both?

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
