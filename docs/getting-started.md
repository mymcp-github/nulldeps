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

## Global State

    import { Store } from '/src/nulldeps.js';

    Store.user = { name: 'Max' };  // All subscribers re-render automatically

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

    http.addRequestInterceptor(config => {
      config.headers['Authorization'] = `Bearer ${Store.token}`;
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
