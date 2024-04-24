export interface ExternalEventEmitter<T> {
  addListener(listener: (data: T) => void): void;
  removeListener(listener: (data: T) => void): void;
}

export type UnsubscribeFn = () => void;

export class EventEmitter<T> implements ExternalEventEmitter<T> {
  private listeners: ((data: T) => void)[] = [];

  addListener(listener: (data: T) => void): UnsubscribeFn {
    this.listeners.push(listener);
    return this.removeListener.bind(this, listener);
  }

  removeListener(listener: (data: T) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  emit(data: T) {
    this.listeners.forEach((listener) => listener(data));
  }
}
