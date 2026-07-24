declare module '@xenova/transformers' {
  export function pipeline(
    task: string,
    model?: string,
    options?: { quantized?: boolean; [key: string]: any }
  ): Promise<any>;
}
