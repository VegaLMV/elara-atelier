import { useRef, useEffect, useMemo } from 'react';

/**
 * Hook to debounce a callback function.
 * @param callback The function to debounce.
 * @param delay The delay in milliseconds.
 * @returns A debounced version of the callback.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);

    // Update the callback ref when it changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Create the debounced function
    const debouncedCallback = useMemo(() => {
        const func = (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        };

        return func;
    }, [delay]);

    // Clean up the timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
}
