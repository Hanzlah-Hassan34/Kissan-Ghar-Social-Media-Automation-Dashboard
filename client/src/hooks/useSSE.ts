import { useEffect, useRef } from 'react';

export function useSSE(eventTypes: string[], onEvent: (eventType: string, data: any) => void) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Create SSE connection
    const eventSource = new EventSource('/api/stream');
    eventSourceRef.current = eventSource;

    // Handle incoming events
    eventSource.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        
        // Only handle events we're interested in
        if (eventTypes.includes(type)) {
          console.log(`SSE Event received: ${type}`, data);
          onEvent(type, data);
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    // Handle connection open
    eventSource.onopen = () => {
      console.log('SSE connection opened');
    };

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [eventTypes, onEvent]);

  return eventSourceRef.current;
}
