export default class SwitchableStream extends TransformStream {
  private _controller: TransformStreamDefaultController | null = null;
  private _currentReader: ReadableStreamDefaultReader | null = null;
  private _switches = 0;
  private _isPumping = false;

  constructor() {
    let controllerRef: TransformStreamDefaultController | undefined;

    super({
      start(controller) {
        controllerRef = controller;
      },
    });

    if (controllerRef === undefined) {
      throw new Error('Controller not properly initialized');
    }

    this._controller = controllerRef;
  }

  async switchSource(newStream: ReadableStream) {
    if (this._currentReader) {
      try {
        await this._currentReader.cancel();
      } catch (error) {
        console.error('Error canceling previous reader:', error);
      }
    }

    this._currentReader = newStream.getReader();
    this._switches++;

    if (!this._isPumping) {
      this._pumpStream();
    }
  }

  private async _pumpStream() {
    if (!this._currentReader || !this._controller) {
      throw new Error('Stream is not properly initialized');
    }

    this._isPumping = true;

    try {
      while (true) {
        const { done, value } = await this._currentReader.read();

        if (done) {
          break;
        }

        this._controller.enqueue(value);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Stream pump error:', error);
        this._controller.error(error);
      }
    } finally {
      this._isPumping = false;
    }
  }

  close() {
    if (this._currentReader) {
      this._currentReader.cancel();
    }

    this._controller?.terminate();
  }

  get switches() {
    return this._switches;
  }
}
