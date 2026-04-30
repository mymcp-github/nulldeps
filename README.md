# NullDeps

> A zero-dependency Web Component framework built on pure web standards.

No build step. No bundler. No npm install. Just the platform.

---

## Why Not npm?

Supply chain attacks on the npm ecosystem are no longer rare edge cases.
They are a **systematic, growing threat** to every project with a `node_modules` folder.

| Year | Package | Impact | Vector |
|------|---------|--------|--------|
| 2021 | **ua-parser-js** | 8M weekly downloads | Crypto-miner injected via hijacked account |
| 2021 | **node-ipc** | Millions of dependents | Protestware — deleted files on Russian IPs |
| 2022 | **colors + faker** | Widespread breakage | Intentionally sabotaged by own author |
| 2023 | **xz-utils** | Near-miss in Linux kernel | 2-year social engineering campaign |
| 2024 | **polyfill.io** | 100k+ websites | CDN domain sold, malware served to end users |
| 2026 | **axios** | 100M+ weekly downloads | Account takeover — RAT via `postinstall` hook |

Every one of these packages was **trusted, maintained, and widely used**.

The attack surface is not your code.
**It is your dependency tree.**

> The only safe dependency is no dependency.

NullDeps has no `package.json`. No lockfile. No `node_modules`.
There is nothing to hijack.

---

## What NullDeps Proves

You don't need any of it.

- **Zero dependencies** — no node_modules, no lockfile hell
- **Pure Web Standards** — Custom Elements, Shadow DOM, native Events
- **Tiny by design** — you ship exactly what you write
- **Framework patterns** — without the framework tax

No setup. No install. Just open and explore.

---

## Getting Started

```bash
git clone https://github.com/mymcp-github/nulldeps
cd nulldeps
python3 -m http.server 3000
# → Demo running at http://localhost:3000/demo/
```

Open [http://localhost:3000/demo/](http://localhost:3000/demo/) in your browser.

> Demo data is stored in `localStorage` — no backend required.

---

## Live Demo

→ [nulldeps.mymcp.de/demo](https://nulldeps.mymcp.de/demo/)

---

## Project Structure

```
nulldeps/
├── src/
│   ├── nulldeps.js              # Main entry — re-exports all core modules
│   ├── theme.js                 # Design tokens + cssVars() helper
│   ├── utility.js               # escHtml, escAttr, cls, uid, whitelist
│   └── core/
│       ├── component.js         # Base Web Component class
│       ├── events.js            # Cross-component EventBus
│       ├── hash-router.js       # Hash-based client-side routing (active)
│       ├── http.js              # Fetch wrapper with error handling
│       ├── router.js            # History API router
│       └── store.js             # Reactive global state
├── demo/
│   ├── components/
│   │   ├── ui-button.js         # Button component
│   │   ├── ui-checkbox.js       # Checkbox component
│   │   ├── ui-input.js          # Input component
│   │   ├── ui-layout.js         # Layout shell component
│   │   └── ui-select.js         # Accessible custom select
│   ├── pages/
│   │   ├── components-page.js   # Component showcase page
│   │   ├── counter-page.js      # Counter demo page
│   │   ├── home-page.js         # Home page (EN)
│   │   ├── home-page-de.js      # Home page (DE)
│   │   ├── task-detail-page.js  # Task detail view
│   │   └── tasks-page.js        # Task list view
│   ├── services/
│   │   ├── task.service.js      # Single task operations
│   │   └── tasks.service.js     # Task collection operations
│   ├── index.html               # Demo entry point
│   └── server.py                # Zero-dependency dev server
├── docs/
├── .gitignore
├── LICENSE
└── README.md
```

---

## Usage

No package manager needed. Just import:

```js
import { Component, Router, createStore, EventBus, http } from './src/nulldeps.js';
```

---

## Core Modules

| Module | File | Purpose |
|--------|------|---------|
| `Component` | `core/component.js` | Base class for Web Components with state & lifecycle |
| `createStore` | `core/store.js` | Reactive global state |
| `Router` | `core/hash-router.js` | Hash-based client-side routing |
| `EventBus` | `core/events.js` | Cross-component communication |
| `http` | `core/http.js` | Fetch wrapper with error handling |

---

## API

### Component

```js
import { Component } from './src/nulldeps.js';

class MyElement extends Component {

  static get watchedAttributes() {
    return ['label', 'value'];
  }

  onMount() {
    this.initState({ count: 0 });
  }

  onAttributeChange(name, oldVal, newVal) {
    this.setState({ [name]: newVal });
  }

  render() {
    return `<p>${this.state.count}</p>`;
  }

  styles() {
    return `p { color: var(--color-text-primary); }`;
  }
}

customElements.define('my-element', MyElement);
```

#### Lifecycle

| Hook | When |
|------|------|
| `onMount()` | After first render, element in DOM |
| `onDestroy()` | Before element is removed |
| `onAttributeChange(name, old, new)` | Observed attribute changed |
| `render()` | Returns HTML string for Shadow DOM |
| `styles()` | Returns CSS string injected into Shadow DOM |

#### State & Events

```js
this.initState({ count: 0 });       // Initial state — call once in onMount()
this.setState({ count: 1 });        // Partial update — triggers re-render
this.state.count;                   // Read current state
this.emit('my:event', { id: 1 });   // Dispatch CustomEvent (bubbles, composed)
```

#### Actions via `data-action`

```html
<button data-action="increment">+</button>
```

```js
onMount() {
  this.initState({ count: 0 });
  this.bindActions({
    increment: () => this.setState({ count: this.state.count + 1 }),
  });
}
```

---

### Store

```js
import { createStore } from './src/nulldeps.js';

const store = createStore(
  { user: null, theme: 'dark' },  // initial state
  { logger, persist }             // optional middleware
);

store.subscribe((state) => console.log(state));
store.set({ user: { name: 'Max' } });
store.state;                       // read current state
```

---

### Router

```js
import { Router } from './src/nulldeps.js';

Router.add('#/home',        () => renderHome());
Router.add('#/tasks/:id',   ({ id }) => renderTask(id));
Router.start();
```

> Uses hash-based routing (`#/path`). No server config needed.

---

### EventBus

```js
import { EventBus } from './src/nulldeps.js';

EventBus.on('task:completed',  (data) => console.log(data));
EventBus.emit('task:completed', { id: 1, points: 10 });
EventBus.off('task:completed', handler);
```

---

### http

```js
import { http } from './src/nulldeps.js';

const data = await http.get('/api/tasks');
await http.post('/api/tasks', { title: 'New Task' });
await http.put('/api/tasks/1', { done: true });
await http.delete('/api/tasks/1');
```

---

## Utility

```js
import { escHtml, escAttr, cls, whitelist } from './src/utility.js';

escHtml('<script>alert(1)</script>');     // → escaped safe string
escAttr('he said "hi"');                 // → attribute-safe string
cls('btn', isActive && 'btn--active');   // → 'btn btn--active'
whitelist(val, ['a','b','c'], 'a');      // → val if allowed, else fallback
```

---

## Theme

Design tokens are defined in `src/theme.js` and injected via `cssVars()`.

```js
import { cssVars, shadow, color } from './src/theme.js';

styles() {
  return `
    :host { ${cssVars()} }
    .wrapper { box-shadow: ${shadow('dropdown')}; }
  `;
}
```

| Token | Value |
|-------|-------|
| `--color-brand` | `#6ee7b7` |
| `--color-bg-surface` | `#111` |
| `--color-text-primary` | `#fff` |
| `--color-error-light` | `#f87171` |
| `--radius-md` | `8px` |
| `--spacing-md` | `0.6rem` |
| `--transition-fast` | `0.1s ease` |
| `--shadow-dropdown` | `0 8px 24px rgba(0,0,0,0.4)` |

---

## UI Components

### `<ui-button>`

```html
<ui-button label="Save" variant="primary" size="md"></ui-button>
```

### `<ui-input>`

```html
<ui-input label="Email" type="email" required error="Invalid email"></ui-input>
```

```js
document.querySelector('ui-input')
  .addEventListener('ui-input:change', ({ detail }) => {
    console.log(detail.value);
  });
```

### `<ui-checkbox>`

```html
<ui-checkbox label="Accept terms" checked></ui-checkbox>
```

### `<ui-select>`

Accessible custom select with keyboard navigation.

```html
<ui-select
  label="Role"
  placeholder="Choose a role..."
  options='[
    {"value":"admin","label":"Admin","icon":"★"},
    {"value":"user","label":"User"},
    {"value":"guest","label":"Guest","disabled":true}
  ]'
></ui-select>
```

```js
document.querySelector('ui-select')
  .addEventListener('ui-select:change', ({ detail }) => {
    console.log(detail.value);
  });
```

---

## Services

Service files in `demo/services/` encapsulate all data operations.
Components never access `localStorage` directly.

```js
// demo/services/tasks.service.js
import { TasksService } from './services/tasks.service.js';

const all   = TasksService.getAll();
const added = TasksService.add({ title: 'New Task' });
TasksService.remove(id);
```

---

## Security

Every component is built with XSS prevention as a first-class concern.

| Mechanism | Where |
|-----------|-------|
| `escHtml()` on all user-supplied strings | Templates |
| `escAttr()` on all attribute interpolations | Templates |
| `whitelist()` for constrained values | State init + attribute change |
| Shadow DOM encapsulation | All components |
| No `innerHTML` on untrusted data | Everywhere |
| `composedPath()` for outside-click detection | `ui-select` |

---

## Browser Support

All modern browsers. No polyfills needed.

| Chrome | Firefox | Safari | Edge |
|--------|---------|--------|------|
| ✅ 67+ | ✅ 63+ | ✅ 16.4+ | ✅ 79+ |

---

## Philosophy

```
The best dependency is no dependency.
The best abstraction is the platform itself.
```

NullDeps gives you **patterns without payloads**.
Real apps. Real architecture. Zero supply chain risk.

---

## Contributing

PRs welcome. Keep it zero-dependency. Keep it simple.

1. Fork the repo
2. Make your changes in `src/` or `demo/components/`
3. Test against the demo in `demo/`
4. Submit a PR — describe what and why

---

## License

MIT
