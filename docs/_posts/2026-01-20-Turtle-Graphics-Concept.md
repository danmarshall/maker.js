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

### 2. SVG Path Language Commands

**A turtle might take in SVG path language commands one at a time.**

The turtle could accept SVG path commands as an alternative input method:

- **Single command mode**: Process one SVG command at a time
- **Batch mode**: Possibly ingest an entire SVG path with multiple commands (needs consideration)

**SVG Commands to Support:**
- `M` (moveto) - Move without drawing
- `L` (lineto) - Draw a line
- `H` (horizontal lineto) - Draw horizontal line
- `V` (vertical lineto) - Draw vertical line
- `A` (elliptical arc) - Draw an arc
- `C` (cubic bezier) - Draw a Bezier curve
- `Q` (quadratic bezier) - Draw a quadratic Bezier curve
- `Z` (closepath) - Close the current path

**Example conceptual API:**
```javascript
var turtle = new makerjs.models.Turtle();

turtle.command('M', [0, 0]);    // Move to origin
turtle.command('L', [10, 0]);   // Line to (10, 0)
turtle.command('L', [10, 10]);  // Line to (10, 10)
turtle.command('Z');            // Close path

// Or possibly:
turtle.parsePathData('M 0,0 L 10,0 L 10,10 Z');
```

**Open Questions:**
- Should the turtle support parsing and executing complete SVG path strings with multiple commands?
- How would relative vs. absolute coordinates be handled?
- Should there be a mode switch between "turtle semantics" (forward/turn) and "SVG semantics" (absolute coordinates)?

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

## Potential API Design

```javascript
// Basic turtle
var turtle = new makerjs.models.Turtle(options);

// Options might include:
// - origin: [x, y] - starting position
// - heading: degrees - initial angle (0 = right, 90 = up)
// - penDown: boolean - start with pen up or down
// - trackIntersections: boolean - enable self-intersection detection
// - layer: string - layer name for paths

// Turtle commands (Logo-style)
turtle.forward(distance);
turtle.back(distance);
turtle.right(angle);  // degrees
turtle.left(angle);
turtle.penUp();
turtle.penDown();
turtle.setHeading(angle);
turtle.setPosition(x, y);
turtle.home();  // return to origin with heading 0

// SVG path commands
turtle.command(commandLetter, parameters);
turtle.parsePathData(svgPathString);  // possibly

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

### Example 1: Simple Square
```javascript
var turtle = new makerjs.models.Turtle();
for (var i = 0; i < 4; i++) {
  turtle.forward(10);
  turtle.right(90);
}
// Creates a closed chain forming a square
```

### Example 2: Star Pattern with Intersection Tracking
```javascript
var turtle = new makerjs.models.Turtle({ trackIntersections: true });

// Draw a 5-pointed star
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

### Example 3: SVG Path Import
```javascript
var turtle = new makerjs.models.Turtle();

// Parse SVG path commands one at a time
turtle.command('M', [0, 0]);
turtle.command('L', [10, 0]);
turtle.command('A', [5, 5, 0, 0, 1, 20, 10]);  // arc
turtle.command('Z');  // close path

// Or potentially parse entire path string
turtle.parsePathData('M 0,0 L 10,0 A 5,5 0 0 1 20,10 Z');
```

## Open Questions

1. **API Style**: Should we favor Logo-style commands (forward/turn) or SVG-style (absolute/relative coordinates), or support both?

2. **SVG Path Parsing**: Should the turtle support full SVG path data strings, or only individual commands? Full path strings are convenient but may conflict with the step-by-step nature of turtle graphics.

3. **Intersection Detection**: 
   - Should intersection detection be always-on or opt-in?
   - What's the performance impact for complex drawings?
   - Should we provide real-time feedback about intersections?

4. **Cleanup Strategies**: Which cleanup modes are most useful? Should this be guided (user chooses) or automatic?

5. **State Management**: Should turtles maintain undo/redo history? Should they support saving/loading state?

6. **Multiple Turtles**: Should we support multiple turtles in the same drawing, potentially creating different chains simultaneously?

7. **Arc Handling**: In Logo-style mode, should we provide an `arc(radius, angle)` command, or stick to line segments and let users compose arcs from forward/turn sequences?

## Benefits

- **Intuitive API**: Turtle graphics is easy to learn and teach
- **Procedural Drawing**: Natural for algorithmic/generative art
- **Chain-First**: Output is inherently suitable for CNC/laser cutting
- **Complementary**: Adds a procedural approach alongside the declarative model approach
- **Educational**: Great for teaching programming and geometry
- **SVG Bridge**: Provides another path for importing SVG content

## Next Steps

Before implementation, we should gather feedback on:
- Which features are most valuable?
- What should the API look like?
- Are there use cases we haven't considered?
- What performance concerns need to be addressed?

This document serves as a starting point for discussion. Please provide feedback and suggestions!

---

*This is a conceptual document and does not represent implemented functionality.*
