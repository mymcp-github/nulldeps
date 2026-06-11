# Getting Started

## Start

    make dev
    # → http://localhost:3000

## Custom Port

    make dev PORT=8080

## Create a Component

    import { Component } from '/src/nulldeps.js';

    class MyCard extends Component {
      template() {
        return `<div class="card">${this.getAttribute('title')}</div>`;
      }

      styles() {
        return `
          .card {
            padding: 1rem;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
          }
        `;
      }
    }

    customElements.define('my-card', MyCard);

    <!-- Usage -->
    <my-card title="Hello NullDeps"></my-card>

## Action Binding

    <!-- In template() -->
    <button data-action="click:save">Save</button>

    <!-- In class -->
    save() {
      console.log('saved!');
    }

## State

    import { createStore } from '/src/nulldeps.js';

    // Each store is an isolated instance - there is no global singleton
    const { store, setState, subscribe, onChange } = createStore({
      user: null,
      theme: 'dark'
    });

    // Read / write through the proxy
    store.theme = 'light';
    setState({ user: { name: 'Max' }, theme: 'light' }); // atomic multi-key

    // React to specific keys (detail = { key, value })
    const stop = subscribe(['user', 'theme'], (e) => {
      console.log(e.detail.key, e.detail.value);
    });

    // ...or to any change (detail = { keys })
    onChange((e) => console.log('changed:', e.detail.keys));

    stop(); // unsubscribe

Notifications are dispatched on each store's own bus - never the global
`window` - so multiple stores on one page never cross-talk.

### Auto re-render in a component

    const ui = createStore({ count: 0 });

    class CountBadge extends Component {
      store = ui;   // bind this component to the store
      template() { return `<b>${ui.store.count}</b>`; }
    }
    customElements.define('count-badge', CountBadge);

    <!-- store-key declares which keys trigger a re-render -->
    <count-badge store-key="count"></count-badge>

## Routing

    import { Router } from '/src/nulldeps.js';

    new Router('#app')
      .add('/', 'home-page')
      .add('/tasks', 'task-list')
      .add('/tasks/:id', 'task-detail')
      .start();

## HTTP

    import { http } from '/src/nulldeps.js';

    http.baseUrl = 'https://api.example.com';

    // Keep the token in memory - never in localStorage, where any injected
    // script can read it. For real auth prefer an httpOnly cookie set by the
    // server (then you don't set this header at all - use credentials:'include').
    let authToken = null;

    http.addRequestInterceptor(config => {
      if (authToken) config.headers['Authorization'] = `Bearer ${authToken}`;
      return config;
    });

    const tasks = await http.get('/tasks');

## EventBus

    import { EventBus } from '/src/nulldeps.js';

    // Subscribe
    const unsubscribe = EventBus.on('task:completed', (e) => {
      console.log(e.detail);
    });

    // Publish
    EventBus.emit('task:completed', { id: 1 });

    // Unsubscribe
    unsubscribe();

## Tests

    make test

## Production

    make nginx-install
    sudo nginx -s reload
