/**
 * NullDeps - HTTP Client
 * Fetch wrapper with interceptors, retry, timeout and backoff
 *
 * Security: validates URLs, guards interceptor returns,
 * safe JSON serialization, status-safe error checks
 */

// Allowed HTTP methods - allowlist prevents arbitrary method injection
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

// Only allow http/https URLs - prevents javascript: and data: injection
const SAFE_URL = /^https?:\/\//i;

/**
 * Validates that a URL is safe to request
 * @param {string} url
 */
function assertSafeUrl(url) {
  try {
    const parsed = new URL(url);
    if (!SAFE_URL.test(parsed.href)) {
      throw new Error('blocked');
    }
  } catch {
    throw new TypeError(`[NullDeps HTTP] Unsafe or invalid URL: "${url}"`);
  }
}

/**
 * Safe JSON serialization - throws readable error on circular refs
 * @param {unknown} body
 * @returns {string}
 */
function safeStringify(body) {
  try {
    return JSON.stringify(body);
  } catch (err) {
    throw new TypeError(`[NullDeps HTTP] Request body could not be serialized: ${err.message}`);
  }
}

/**
 * Checks if an error status code is a client error (4xx)
 * Safe against undefined/NaN status
 * @param {unknown} status
 * @returns {boolean}
 */
function isClientError(status) {
  return typeof status === 'number' && status >= 400 && status < 500;
}

/**
 * Core request function
 * @param {string} method
 * @param {string} path
 * @param {unknown} body
 * @param {object} options
 */
async function _request(method, path, body = null, options = {}) {
  if (!ALLOWED_METHODS.has(method)) {
    throw new TypeError(`[NullDeps HTTP] Method not allowed: "${method}"`);
  }

  if (typeof path !== 'string' || !path.trim()) {
    throw new TypeError('[NullDeps HTTP] Path must be a non-empty string');
  }

  const { timeout = 10000, retries = 0, ...restOptions } = options;

  if (typeof timeout !== 'number' || timeout <= 0) {
    throw new TypeError('[NullDeps HTTP] timeout must be a positive number');
  }

  if (typeof retries !== 'number' || retries < 0 || !Number.isInteger(retries)) {
    throw new TypeError('[NullDeps HTTP] retries must be a non-negative integer');
  }

  let config = {
    method,
    headers: { 'Content-Type': 'application/json', ...restOptions.headers },
    ...restOptions
  };

  if (body !== null) {
    config.body = safeStringify(body);
  }

  // Run request interceptors - guard against broken interceptors returning undefined
  for (const interceptor of http._requestInterceptors) {
    const result = await interceptor(config);
    if (result && typeof result === 'object') {
      config = result;
    } else {
      console.warn('[NullDeps HTTP] Request interceptor returned invalid config - skipped');
    }
  }

  // Build and validate final URL
  const url = `${http.baseUrl}${path}`;
  assertSafeUrl(url);

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      let response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timer);

      // Run response interceptors - guard against broken interceptors
      for (const interceptor of http._responseInterceptors) {
        const result = await interceptor(response);
        if (result instanceof Response) {
          response = result;
        } else {
          console.warn('[NullDeps HTTP] Response interceptor returned non-Response - skipped');
        }
      }

      if (!response.ok) {
        const errorBody = await response.json()
          .catch(() => ({ message: response.statusText }));

        throw Object.assign(
          new Error(errorBody.message ?? response.statusText),
          { status: response.status, body: errorBody }
        );
      }

      // 204 No Content - return null
      if (response.status === 204) return null;

      return await response.json();

    } catch (err) {
      clearTimeout(timer);
      lastError = err;

      // Never retry on abort (timeout) or 4xx client errors
      if (err.name === 'AbortError' || isClientError(err.status)) throw err;

      if (attempt < retries) {
        // Exponential backoff: 300ms, 600ms, 1200ms ...
        await new Promise(r => setTimeout(r, 2 ** attempt * 300));
      }
    }
  }

  throw lastError;
}

export const http = {
  baseUrl: '',

  // Internal interceptor arrays - underscore signals internal use
  _requestInterceptors: [],
  _responseInterceptors: [],

  /**
   * Set the base URL for all requests
   * Validates URL format before accepting
   * @param {string} url
   */
  setBaseUrl(url) {
    if (typeof url !== 'string') {
      throw new TypeError('[NullDeps HTTP] baseUrl must be a string');
    }
    // Allow empty string (relative URLs) or valid http/https
    if (url !== '' && !SAFE_URL.test(url)) {
      throw new TypeError(`[NullDeps HTTP] baseUrl must be http/https or empty, got: "${url}"`);
    }
    this.baseUrl = url;
  },

  /**
   * Add a request interceptor
   * Interceptor receives config object and must return a config object
   * @param {function} fn
   * @returns {function} unsubscribe
   */
  addRequestInterceptor(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('[NullDeps HTTP] Request interceptor must be a function');
    }
    this._requestInterceptors.push(fn);
    return () => {
      const i = this._requestInterceptors.indexOf(fn);
      if (i > -1) this._requestInterceptors.splice(i, 1);
    };
  },

  /**
   * Add a response interceptor
   * Interceptor receives Response and must return a Response
   * @param {function} fn
   * @returns {function} unsubscribe
   */
  addResponseInterceptor(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('[NullDeps HTTP] Response interceptor must be a function');
    }
    this._responseInterceptors.push(fn);
    return () => {
      const i = this._responseInterceptors.indexOf(fn);
      if (i > -1) this._responseInterceptors.splice(i, 1);
    };
  },

  get:    (path, options)       => _request('GET',    path, null, options),
  post:   (path, body, options) => _request('POST',   path, body, options),
  put:    (path, body, options) => _request('PUT',    path, body, options),
  patch:  (path, body, options) => _request('PATCH',  path, body, options),
  delete: (path, options)       => _request('DELETE', path, null, options),
};
