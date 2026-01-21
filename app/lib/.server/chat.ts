export interface Tracer {
  startSpan(name: string): {
    setAttribute(key: string, value: any): void;
    end(): void;
  };
}
