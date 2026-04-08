const _requestInterceptors = [];
const _responseInterceptors = [];

async function _request(method, path, body = null, options = {}) {
  const { timeout = 10000, retries = 0, ...restOptions } = options;

  let config = {
    method,
    headers: { 'Content-Type': 'application/json', ...restOptions.headers },
    ...restOptions
  };

  if (body) config.body = JSON.stringify(body);

  for (const interceptor of _requestInterceptors) {
    config = await interceptor(config);
  }

  const url = `${http.baseUrl}${path}`;
  
  // Attempt with optional retry
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // AbortController for timeout
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      let response = await fetch(url, { 
        ...config, 
        signal: controller.signal 
      });
      clearTimeout(timer);

      for (const interceptor of _responseInterceptors) {
        response = await interceptor(response);
      }

      if (!response.ok) {
        const error = await response.json()
          .catch(() => ({ message: response.statusText }));
        throw Object.assign(
          new Error(error.message), 
          { status: response.status, body: error }
        );
      }

      if (response.status === 204) return null;
      return response.json();

    } catch (err) {
      lastError = err;
      // Don't retry on abort or client errors (4xx)
      if (err.name === 'AbortError' || err.status < 500) throw err;
      if (attempt < retries) {
        // Exponential backoff
        await new Promise(r => setTimeout(r, 2 ** attempt * 300));
      }
    }
  }
  throw lastError;
}

export const http = {
  baseUrl: '',

  addRequestInterceptor(fn) {
    _requestInterceptors.push(fn);
    return () => {
      const i = _requestInterceptors.indexOf(fn);
      if (i > -1) _requestInterceptors.splice(i, 1);
    };
  },

  addResponseInterceptor(fn) {
    _responseInterceptors.push(fn);
    return () => {
      const i = _responseInterceptors.indexOf(fn);
      if (i > -1) _responseInterceptors.splice(i, 1);
    };
  },

  get:    (path, options)       => _request('GET',    path, null, options),
  post:   (path, body, options) => _request('POST',   path, body, options),
  put:    (path, body, options) => _request('PUT',    path, body, options),
  patch:  (path, body, options) => _request('PATCH',  path, body, options),
  delete: (path, options)       => _request('DELETE', path, null, options),
};
