```markdown
# NullDeps

> A zero-dependency Web Component framework built on pure web standards.

No build step. No bundler. No npm install. Just the platform.

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
| 2026 | **axios** | 300M weekly downloads | Account takeover — RAT deployed cross-platform via `postinstall` hook, spread to PyPI & NuGet |

Every one of these packages was **trusted, maintained, and widely used**.

The attack surface is not your code.  
**It is your dependency tree.**

> The only safe dependency is no dependency.

NullDeps has no `package.json`. No lockfile. No `node_modules`.  
There is nothing to hijack.

NullDeps proves you don't need any of it.

- Zero dependencies** — no node_modules, no lockfile hell
- Pure Web Standards** — Custom Elements, Shadow DOM, native Events
- Tiny by design** — you ship exactly what you write
- Framework patterns** — without the framework tax


## Live Demo

**Live Demo:** [nulldeps.mymcp.de/demo](https://nulldeps.mymcp.de/demo/)
No setup. No install. Just open and explore.

## Getting Started

```bash
git clone https://github.com/mymcp-github/nulldeps
cd nulldeps
npx serve . -p 3000
# → Demo running at http://localhost:3000/demo/
```

Then open [http://localhost:3000/demo/](http://localhost:3000/demo/) in your browser.

> Demo data is stored in `localStorage` — no backend required.

## Usage

No package manager needed. Just import:

```js
import { Component, Router, Store, EventBus } from './src/nulldeps.js';
```

## Core Modules

| Module | File | Purpose |
|--------|------|---------|
| `Component` | `core/component.js` | Base class for Web Components with state & lifecycle |
| `Store` | `core/store.js` | Reactive global state |
| `Router` | `core/router.js` | Client-side routing |
| `EventBus` | `core/events.js` | Cross-component communication |

## API

### Component

```js
import { Component } from './src/nulldeps.js';

class MyElement extends Component {
  connectedCallback() {
    this.setState({ count: 0 });
  }

  render() {
    return `<p>${this.state.count}</p>`;
  }
}

customElements.define('my-element', MyElement);
```

### Store

```js
import { Store } from './src/nulldeps.js';

const store = new Store({ user: null, theme: 'dark' });

store.subscribe((state) => console.log(state));
store.set({ user: { name: 'Max' } });
```

### Router

```js
import { Router } from './src/nulldeps.js';

Router.add('/home', () => renderHome());
Router.add('/tasks/:id', ({ id }) => renderTask(id));
Router.start();
```

### EventBus

```js
import { EventBus } from './src/nulldeps.js';

EventBus.on('task:completed', (data) => console.log(data));
EventBus.emit('task:completed', { id: 1, points: 10 });
```

## Philosophy

```
The best dependency is no dependency.
The best abstraction is the platform itself.
```

NullDeps gives you **patterns without payloads**.

## Browser Support

All modern browsers. No polyfills needed.

| Chrome | Firefox | Safari | Edge |
|--------|---------|--------|------|
| ✅ 67+ | ✅ 63+ | ✅ 16.4+ | ✅ 79+ |

## Contributing

PRs welcome. Keep it zero-dependency. Keep it simple.

1. Fork the repo
2. Make your changes in `src/`
3. Test against the demo in `demo/`
4. Submit a PR

## License

MIT
```