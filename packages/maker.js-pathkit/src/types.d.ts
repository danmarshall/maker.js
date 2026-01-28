/**
 * Type definitions for PathKit integration
 */

declare module 'pathkit-wasm' {
    interface PathKitInit {
        (options?: { locateFile?: (file: string) => string }): Promise<PathKit>;
    }

    interface PathKit {
        FromSVGString(svgPath: string): SkPath;
        MakeFromOp(path1: SkPath, path2: SkPath, op: PathOp): SkPath;
        PathOp: {
            DIFFERENCE: number;
            INTERSECT: number;
            UNION: number;
            XOR: number;
            REVERSE_DIFFERENCE: number;
        };
    }

    interface SkPath {
        toSVGString(): string;
        getBounds(): [number, number, number, number];
        copy(): SkPath;
        simplify(): boolean;
        delete(): void;
    }

    type PathOp = number;

    const PathKitInit: PathKitInit;
    export = PathKitInit;
}
