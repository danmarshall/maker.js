﻿/// <reference path="exporter.ts" />
/// <reference path="xml.ts" />

module MakerJs.exporter {

    /**
     * @private
     */
    interface IPathDirectionalFunction {
        (pathValue: IPath, pathDirectional: IPathDirectional): void;
    }

    /**
     * @private
     */
    interface IPathDirectionalFunctionMap {
        [type: string]: IPathDirectionalFunction;
    }

    /**
     * @private
     */
    function wrap(prefix: string, content: string, condition: any): string {
        if (condition) {
            return prefix + '(' + content + ')';
        } else {
            return content;
        }
    }

    /**
     * @private
     */
    function facetSizeToResolution(arcOrCircle: IPathCircle, facetSize: number): number {
        if (!facetSize) return;

        var circle = new paths.Circle([0, 0], arcOrCircle.radius);
        
        var length = measure.pathLength(circle);
        if (!length) return;
        
        return length / facetSize;
    }

    /**
     * @private
     */
    function pathsToOpenJsCad(modelContext: IModel, facetSize?: number): string {

        var head = '';
        var tail = '';
        var first = true;
        var exit = false;
        var reverseTail = false;

        var beginMap: IPathDirectionalFunctionMap = {};

        beginMap[pathType.Circle] = function (circle: IPathCircle, dirPath: IPathDirectional) {
            var circleOptions: CSG.ICircleOptions = {
                center: <number[]>point.rounded(circle.origin),
                radius: circle.radius,
                resolution: facetSizeToResolution(circle, facetSize)
            };
            head = wrap('CAG.circle', JSON.stringify(circleOptions), true);
            exit = true;
        };

        beginMap[pathType.Line] = function (line: IPathLine, dirPath: IPathDirectional) {
            head = wrap('new CSG.Path2D', JSON.stringify(dirPath.reversed ? [dirPath.endPoints[1], dirPath.endPoints[0]] : dirPath.endPoints), true);
        };

        beginMap[pathType.Arc] = function (arc: IPathArc, dirPath: IPathDirectional) {
            var endAngle = angle.ofArcEnd(arc);
            if (dirPath.reversed) {
                reverseTail = true;
            }
            var arcOptions: CSG.IArcOptions = {
                center: <number[]>point.rounded(arc.origin),
                radius: arc.radius,
                startangle: arc.startAngle,
                endangle: endAngle,
                resolution: facetSizeToResolution(arc, facetSize)
            };
            head = wrap('new CSG.Path2D.arc', JSON.stringify(arcOptions), true);
        };

        var appendMap: IPathDirectionalFunctionMap = {};

        appendMap[pathType.Line] = function (line: IPathLine, dirPath: IPathDirectional) {
            var reverse = (reverseTail != dirPath.reversed);
            var endPoint = point.rounded(dirPath.endPoints[reverse ? 0 : 1]);
            append(wrap('.appendPoint', JSON.stringify(endPoint), true));
        };

        appendMap[pathType.Arc] = function (arc: IPathArc, dirPath: IPathDirectional) {
            var reverse = (reverseTail != dirPath.reversed);
            var endAngle = angle.ofArcEnd(arc);
            var arcOptions: CSG.IEllpiticalArcOptions = {
                radius: arc.radius,
                clockwise: reverse,
                large: Math.abs(endAngle - arc.startAngle) > 180,
                resolution: facetSizeToResolution(arc, facetSize)
            };
            var endPoint = point.rounded(dirPath.endPoints[reverse ? 0 : 1]);
            append(wrap('.appendArc', JSON.stringify(endPoint) + ',' + JSON.stringify(arcOptions), true));
        }

        function append(s: string) {
            if (reverseTail) {
                tail = s + tail;
            } else {
                tail += s;
            }
        }

        for (var pathId in modelContext.paths) {
            var pathContext = modelContext.paths[pathId];
            
            var fn = first ? beginMap[pathContext.type] : appendMap[pathContext.type];

            if (fn) {
                fn(pathContext, <IPathDirectional>pathContext);
            }

            if (exit) {
                return head;
            }

            first = false;
        }

        return head + tail + '.close().innerToCAG()';
    }

    export function toOpenJsCad(modelToExport: IModel, options?: IOpenJsCadOptions): string;
    export function toOpenJsCad(pathsToExport: IPath[], options?: IOpenJsCadOptions): string;
    export function toOpenJsCad(pathToExport: IPath, options?: IOpenJsCadOptions): string;

    /**
     * Creates a string of JavaScript code for execution with the OpenJsCad engine.
     * 
     * @param modelToExport Model object to export.
     * @param options Export options object.
     * @param options.extrusion Height of 3D extrusion.
     * @param options.resolution Size of facets.
     * @returns String of JavaScript containing a main() function for OpenJsCad.
     */
    export function toOpenJsCad(modelToExport: IModel, options?: IOpenJsCadOptions): string {
        var all = '';
        var depth = 0;
        var depthModel: IModel;

        var opts: IOpenJsCadOptions = {
            extrusion: 1,
            accuracy: .0001
        };

        extendObject(opts, options);

        var loops = model.findLoops(modelToExport, opts.accuracy);

        while (depthModel = loops.models[depth]) {
            var union = '';
            for (var modelId in depthModel.models) {
                var subModel = depthModel.models[modelId];
                union += wrap('.union', pathsToOpenJsCad(subModel, opts.facetSize), union);
            }
            var operator = (depth % 2 == 0) ? '.union' : '.subtract';
            all += wrap(operator, union, all);
            depth++;
        }

        var extrudeOptions: CAG.CAG_extrude_options = { offset: [0, 0, opts.extrusion] };
        var extrude = wrap('.extrude', JSON.stringify(extrudeOptions), true);

        return 'function main(){return ' + all + extrude + ';}';
    }

    /**
     * Executes a JavaScript string with the OpenJsCad engine - converts 2D to 3D.
     * 
     * @param modelToExport Model object to export.
     * @param options Export options object.
     * @param options.extrusion Height of 3D extrusion.
     * @param options.resolution Size of facets.
     * @returns String of STL format of 3D object.
     */
    export function toSTL(modelToExport: IModel, options?: IOpenJsCadOptions) {

        var script = toOpenJsCad(modelToExport, options);

        script += 'return main();';

        var f = new Function(script);
        var csg = <CSG>f();

        return csg.toStlString();
    }

    /**
     * OpenJsCad export options.
     */
    export interface IOpenJsCadOptions extends IExportOptions {

        /**
         * Optional depth of 3D extrusion.
         */
        extrusion?: number;

        /**
         * Optional size of curve facets.
         */
        facetSize?: number;

        /**
         * Optional accuracy of points.
         */
        accuracy?: number
    }
}
 