declare module 'bs58' {
  export function encode(data: Uint8Array | number[] | Buffer): string;
  export function decode(string: string): Uint8Array;
  const bs58: {
    encode: typeof encode;
    decode: typeof decode;
  };
  export default bs58;
}
