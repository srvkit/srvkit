type WaitForOptions = {
    timeout?: number;
    interval?: number;
};

const waitFor = async <T>(
    fn: () => Promise<T>,
    condition: (result: T) => boolean,
    options?: WaitForOptions,
): Promise<T> => {
    const timeout: number = options?.timeout ?? 10000;
    const interval: number = options?.interval ?? 300;

    const start: number = Date.now();

    while (true) {
        try {
            const result: T = await fn();

            if (condition(result)) {
                return result;
            }
        } catch {
            // ignore errors, retry
        }

        if (Date.now() - start >= timeout) {
            throw new Error(`waitFor timed out after ${timeout}ms`);
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
    }
};

export type { WaitForOptions };
export { waitFor };
