---
layout: post
title: Turtle Graphics - Geometric Algorithms and Strategies
---

# Turtle Geometric Algorithms and Strategies

This document explores geometric algorithms and strategies for the proposed Turtle feature in Maker.js, with a focus on detecting and handling unwanted inner geometry that can arise during path construction.

## The Inner Geometry Problem

When a turtle creates paths sequentially, it's possible to inadvertently create small geometric features (like triangles or other shapes) that end up inside a larger closed geometry. These inner features may be unwanted artifacts, especially when using nonzero fill rules for rendering.

### Example Scenario

Consider this sequence of turtle commands:

```javascript
turtle.execute({ command: 'moveTo', args: [0, 0] });
turtle.execute({ command: 'lineTo', args: [10, 0] });
turtle.execute({ command: 'lineTo', args: [10, 21] });
turtle.execute({ command: 'lineTo', args: [9, 20] });  // Creates a small triangle
turtle.execute({ command: 'lineTo', args: [20, 20] }); // Crosses back - triangle position unknown
turtle.execute({ command: 'lineTo', args: [20, 30] });
turtle.execute({ command: 'lineTo', args: [0, 30] });
turtle.execute({ command: 'closePath', args: [] });    // Now we can determine if triangle is inside
```

In this example:
1. A small triangle is formed at coordinates (10, 21), (9, 20), (10, 20)
2. At the moment the triangle is created, we don't know if it will end up inside or outside the final shape
3. Only when the path is closed can we determine the triangle's relationship to the outer boundary

**Why do font authors do this?** Some font formats and font authoring tools can generate these artifacts due to:
- Algorithmic font generation
- Conversion between different font formats
- Edge cases in font hinting or auto-tracing
- Manual editing errors

## Geometric Strategies

### Strategy 1: Deferred Analysis (Detect on Close)

Wait until a `closePath` command is executed, then analyze the complete geometry to identify inner unwanted features.

**Advantages:**
- Complete information available for analysis
- Can use well-established algorithms (point-in-polygon, winding number)
- Accurate determination of inside/outside relationships

**Disadvantages:**
- No feedback during construction
- All analysis happens at once, potentially expensive for complex paths
- Doesn't help with open paths

**Algorithm Steps:**
```javascript
// Pseudocode for deferred analysis
function analyzeOnClose(turtle) {
  var allSegments = turtle.getSegments();
  var closedPath = turtle.getClosedPath();
  
  // 1. Identify potential inner geometry (small triangles, degenerate shapes)
  var suspects = identifySmallFeatures(allSegments, threshold);
  
  // 2. For each suspect, determine if it's inside the main geometry
  var innerFeatures = [];
  for (var suspect of suspects) {
    var centroid = calculateCentroid(suspect);
    if (isPointInPolygon(centroid, closedPath)) {
      innerFeatures.push(suspect);
    }
  }
  
  // 3. Return or automatically remove inner features
  return innerFeatures;
}
```

### Strategy 2: Incremental Detection (Track Crossings)

Monitor for self-intersections during path construction and maintain metadata about potential inner regions.

**Advantages:**
- Real-time feedback as path is constructed
- Can distribute computational cost over multiple operations
- Enables interactive warnings or visualizations

**Disadvantages:**
- More complex state management
- May flag false positives that resolve as path continues
- Requires tracking intersection history

**Algorithm Steps:**
```javascript
// Pseudocode for incremental detection
function onNewSegment(turtle, newSegment) {
  var previousSegments = turtle.getSegments();
  
  // 1. Check for intersections with previous segments
  var intersections = findIntersections(newSegment, previousSegments);
  
  // 2. Store intersection metadata
  for (var intersection of intersections) {
    turtle.recordIntersection({
      point: intersection.point,
      segments: [intersection.segment1, intersection.segment2],
      timestamp: turtle.getCommandCount()
    });
  }
  
  // 3. Detect closed loops formed by crossings
  var newLoops = detectClosedLoops(turtle.intersections);
  
  // 4. Mark loops as potential inner geometry
  turtle.markPotentialInnerGeometry(newLoops);
}
```

### Strategy 3: Winding Number Analysis

Use the winding number algorithm to determine if geometry is inside or outside based on how the path winds around a point.

**Advantages:**
- Mathematically robust
- Handles complex shapes correctly
- Works with nonzero fill rule semantics

**Disadvantages:**
- Requires complete closed path
- Computationally intensive for many points
- May need careful handling of edge cases (point on boundary)

**Algorithm:**
```javascript
function windingNumber(point, polygon) {
  var wn = 0;  // winding number counter
  
  for (var i = 0; i < polygon.length; i++) {
    var p1 = polygon[i];
    var p2 = polygon[(i + 1) % polygon.length];
    
    if (p1[1] <= point[1]) {
      if (p2[1] > point[1]) {  // Upward crossing
        if (isLeft(p1, p2, point) > 0) {
          wn++;
        }
      }
    } else {
      if (p2[1] <= point[1]) {  // Downward crossing
        if (isLeft(p1, p2, point) < 0) {
          wn--;
        }
      }
    }
  }
  
  return wn;  // 0 = outside, nonzero = inside
}

function isLeft(p0, p1, p2) {
  return ((p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1]));
}
```

### Strategy 4: Area-Based Detection

Identify small features by calculating the area they enclose and comparing to a threshold.

**Advantages:**
- Simple heuristic
- Fast to compute
- Good for finding obvious artifacts

**Disadvantages:**
- Requires tuning threshold parameter
- May miss elongated but still unwanted features
- Can produce false positives/negatives

**Algorithm:**
```javascript
function detectSmallFeatures(path, areaThreshold) {
  var features = [];
  var segments = path.getSegments();
  
  // Look for groups of segments that form small closed loops
  for (var i = 0; i < segments.length; i++) {
    for (var j = i + 1; j < segments.length; j++) {
      if (segmentsConnect(segments[i], segments[j])) {
        var loop = extractLoop(segments, i, j);
        var area = calculatePolygonArea(loop);
        
        if (Math.abs(area) < areaThreshold) {
          features.push({
            loop: loop,
            area: area,
            indices: [i, j]
          });
        }
      }
    }
  }
  
  return features;
}

function calculatePolygonArea(points) {
  var area = 0;
  for (var i = 0; i < points.length; i++) {
    var j = (i + 1) % points.length;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  return area / 2;
}
```

## Proposed API Integration

### Detection API

```javascript
// Configure detection during turtle creation
var turtle = new makerjs.models.Turtle({
  trackInnerGeometry: true,
  innerGeometryThreshold: 1.0,  // area threshold
  strategy: 'deferred'  // 'deferred', 'incremental', 'winding', or 'area'
});

// Query detected inner geometry
var innerFeatures = turtle.getInnerGeometry();
// Returns: [
//   { type: 'triangle', area: 0.5, vertices: [[10,21], [9,20], [10,20]] },
//   ...
// ]

// Get analysis after closing path
turtle.execute({ command: 'closePath', args: [] });
var analysis = turtle.analyzeGeometry();
// Returns: {
//   outerBoundary: {...},
//   innerFeatures: [...],
//   windingRule: 'nonzero',
//   totalArea: 100.0,
//   innerArea: 0.5
// }
```

### Cleanup API

```javascript
// Automatically remove inner geometry
var cleanModel = turtle.removeInnerGeometry({
  threshold: 1.0,
  strategy: 'area'
});

// Manual selection and removal
var innerFeatures = turtle.getInnerGeometry();
turtle.removeFeatures([innerFeatures[0], innerFeatures[2]]);

// Preview what would be removed
var preview = turtle.previewCleanup({
  threshold: 1.0,
  highlightRemoved: true
});
```

## Implementation Considerations

### Performance

- **Deferred analysis**: O(n²) for n segments in worst case (checking all pairs)
- **Incremental detection**: Amortized O(n) if using spatial indexing
- **Winding number**: O(n) per query point
- **Area calculation**: O(n) for n vertices

**Optimization strategies:**
1. Use spatial indexing (R-tree, KD-tree) for intersection detection
2. Cache computed areas and winding numbers
3. Only analyze on explicit request or when path is closed
4. Use bounding boxes for quick rejection tests

### Edge Cases

1. **Self-tangent paths**: Paths that touch themselves without crossing
2. **Multiple inner features**: Several small artifacts in one path
3. **Nested geometry**: Inner features that contain other inner features
4. **Degenerate cases**: Zero-area triangles, collinear points
5. **Open paths**: How to handle paths that aren't closed?

### Nonzero vs. Even-Odd Fill Rules

Different fill rules affect how inner geometry should be interpreted:

**Nonzero Fill Rule:**
- Winding number determines fill: nonzero = filled, zero = unfilled
- Inner geometry with opposite winding may create holes (intentional)
- Only remove inner geometry with same winding direction as outer

**Even-Odd Fill Rule:**
- Alternating inside/outside on each crossing
- All inner geometry may be intentional (creating holes)
- Be more conservative about automatic removal

## Example Use Cases

### Use Case 1: Font Glyph Cleaning

```javascript
// Load or generate a glyph
var turtle = new makerjs.models.Turtle({ trackInnerGeometry: true });

// Execute commands from font file
turtle.executeAll(glyphCommands);

// Detect and remove artifacts
var innerFeatures = turtle.getInnerGeometry();
console.log(`Found ${innerFeatures.length} potential artifacts`);

// Remove small features (< 1 square unit)
var cleanGlyph = turtle.removeInnerGeometry({ threshold: 1.0 });
```

### Use Case 2: Interactive Drawing with Warnings

```javascript
// User draws with turtle
var turtle = new makerjs.models.Turtle({ 
  trackInnerGeometry: true,
  strategy: 'incremental'
});

// As user draws, check for inner geometry
turtle.on('innerGeometryDetected', function(feature) {
  console.warn('Small feature detected:', feature);
  // Show visual indicator to user
});

// User can choose to keep or remove
if (userWantsToRemove) {
  turtle.removeFeatures([feature]);
}
```

### Use Case 3: Batch Glyph Processing

```javascript
// Process multiple glyphs from a font
function cleanFont(font) {
  var cleanedGlyphs = {};
  
  for (var glyphName in font.glyphs) {
    var glyph = font.glyphs[glyphName];
    var turtle = new makerjs.models.Turtle();
    
    // Convert glyph to turtle commands
    turtle.executeAll(glyphToCommands(glyph));
    
    // Analyze and clean
    var analysis = turtle.analyzeGeometry();
    if (analysis.innerFeatures.length > 0) {
      console.log(`${glyphName}: removing ${analysis.innerFeatures.length} features`);
      cleanedGlyphs[glyphName] = turtle.removeInnerGeometry();
    } else {
      cleanedGlyphs[glyphName] = turtle.toModel();
    }
  }
  
  return cleanedGlyphs;
}
```

## Open Questions

1. **Threshold Selection**: How should users determine appropriate area or size thresholds? Should there be automatic threshold calculation?

2. **Intentional Inner Geometry**: How to distinguish between unwanted artifacts and intentional inner features (like counters in letters)?

3. **Performance Trade-offs**: When should analysis be automatic vs. on-demand? What's an acceptable performance cost?

4. **Multi-path Geometry**: How to handle multiple disjoint paths created by a single turtle? Should each be analyzed separately?

5. **Undo/Redo**: If inner geometry is automatically removed, should there be an undo mechanism?

6. **Visualization**: Should the turtle provide visualization helpers to show detected inner geometry during development?

7. **Integration with Boolean Operations**: How should inner geometry detection interact with combine/union/subtract operations?

## Recommended Approach

For initial implementation, we recommend:

1. **Start with Deferred Analysis**: Implement Strategy 1 (detect on close) as it's simpler and more reliable
2. **Use Winding Number**: Implement Strategy 3 for robust inside/outside determination
3. **Add Area-Based Filtering**: Combine with Strategy 4 to filter by size threshold
4. **Make it Opt-in**: Require explicit configuration to enable detection
5. **Provide Inspection API**: Let users examine detected features before removal
6. **Support Manual Cleanup**: Allow selective removal rather than only automatic

This provides a solid foundation that can be extended with more sophisticated strategies (like incremental detection) in future iterations.

## References

- **Point in Polygon**: [Winding Number Algorithm](http://geomalgorithms.com/a03-_inclusion.html)
- **Self-Intersection**: [Bentley-Ottmann Algorithm](https://en.wikipedia.org/wiki/Bentley%E2%80%93Ottmann_algorithm)
- **Fill Rules**: [SVG Fill Rule Property](https://www.w3.org/TR/SVG/painting.html#FillRuleProperty)
- **Polygon Area**: [Surveyor's Formula](https://en.wikipedia.org/wiki/Shoelace_formula)

---

*This is a conceptual document exploring geometric algorithms for the proposed Turtle feature. Actual implementation may vary based on performance requirements and use case priorities.*
