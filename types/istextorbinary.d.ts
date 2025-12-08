declare module 'istextorbinary' {
  export interface EncodingOpts {
    /** Defaults to 24 */
    chunkLength?: number;

    /** If not provided, will check the start, beginning, and end */
    chunkBegin?: number;
  }

  export function getEncoding(buffer: Buffer | null, opts?: EncodingOpts): 'utf8' | 'binary' | null;
}
