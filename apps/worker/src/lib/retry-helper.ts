interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

interface FetchError extends Error {
  status?: number;
  code?: string;
}

function isRetryableError(error: FetchError): boolean {
  // Network errors (connection issues, timeouts, etc.)
  if (error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'EAI_AGAIN') {
    return true;
  }

  // HTTP status codes
  if (error.status) {
    // Rate limiting
    if (error.status === 429) {
      return true;
    }
    
    // Server errors (5xx)
    if (error.status >= 500 && error.status <= 504) {
      return true;
    }
    
    // Non-retryable client errors (4xx except 429)
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
  }

  // Default: don't retry unknown errors
  return false;
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  
  // Add jitter (random 0-25% of delay) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * Math.random();
  
  const totalDelay = exponentialDelay + jitter;
  
  // Cap at maximum delay
  return Math.min(totalDelay, maxDelayMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff for async operations
 * 
 * @param fn - The function to retry
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    onRetry = (error, attempt, delayMs) => {
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delayMs}ms delay. Error: ${error.message}`);
    }
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      const shouldRetry = isRetryableError(lastError as FetchError);
      
      if (attempt === maxAttempts - 1 || !shouldRetry) {
        throw lastError;
      }
      
      const delayMs = calculateBackoff(attempt, baseDelayMs, maxDelayMs);
      
      onRetry(lastError, attempt + 1, delayMs);
      
      await sleep(delayMs);
    }
  }

  throw lastError!;
}

/**
 * Wrapper specifically for fetch requests with retry logic
 * Enriches errors with status codes for better retry decisions
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return withRetry(async () => {
    try {
      const response = await fetch(url, init);
      return response;
    } catch (error) {
      const enrichedError = error as FetchError;
      throw enrichedError;
    }
  }, retryOptions);
}
