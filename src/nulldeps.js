/**
 * NullDeps - Public API
 * Single entry point for all framework modules
 */
export { Component } from './core/component.js';
export { createStore, logger, persist } from './core/store.js'; // createStore, not Store
//export { Router } from './core/router.js';
export { Router } from './core/hash-router.js';
export { http } from './core/http.js';
export { EventBus } from './core/events.js';
