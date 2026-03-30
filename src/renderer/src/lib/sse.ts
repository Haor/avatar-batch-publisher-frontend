export interface SseHandlers<TPayload> {
  onEvent: (eventName: string, payload: TPayload) => void;
  onError?: (event: Event) => void;
}

export function createEventStream<TPayload>(
  baseUrl: string,
  path: string,
  eventNames: readonly string[],
  handlers: SseHandlers<TPayload>
): EventSource {
  const source = new EventSource(`${baseUrl}${path}`);

  for (const eventName of eventNames) {
    source.addEventListener(eventName, (event) => {
      const messageEvent = event as MessageEvent<string>;
      handlers.onEvent(eventName, JSON.parse(messageEvent.data) as TPayload);
    });
  }

  source.onerror = (event) => {
    handlers.onError?.(event);
  };

  return source;
}
