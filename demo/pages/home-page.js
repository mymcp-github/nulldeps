// home-page.js - NullDeps framework landing/documentation page
import { Component } from '/src/nulldeps.js';

class HomePage extends Component {
  template() {
    return `
      <div class="hero">
        <div class="hero-badge">v1.0 · Zero Dependencies</div>
        <h1 class="hero-title">NullDeps</h1>
        <p class="hero-sub">No Build. No Bundle. No Bullshit.</p>
      </div>

      <div class="intro">
        <p class="lead">
          NullDeps is a web framework built on a single conviction:
        </p>
        <blockquote>
          The browser is already a framework. You don't need another one.
        </blockquote>
      </div>

      <section class="section">
        <h2>Why NullDeps exists</h2>
        <p>
          Somewhere between 2015 and today, something went wrong.
        </p>
        <p>
          We started installing frameworks to use frameworks to abstract frameworks –
          only to end up with a <code>node_modules</code> folder containing 847 packages
          that render a page saying "Hello World".
        </p>
        <p>
          We accepted build steps as if they were laws of nature. We treated
          TypeScript compilers, Vite configs, Babel plugins and tree-shaking strategies
          as <em>self-evident</em> – and forgot to ask:
          <strong>What for, exactly?</strong>
        </p>
        <p>NullDeps is the answer to that question.</p>
      </section>

      <section class="section section--warning">
  <h2>The hidden cost of dependencies</h2>
  <p>
    Every package you install is a door you leave open.
  </p>
  <ul class="incident-list">
  <li>
    <span class="year">2021</span>
    <strong>ua-parser-js</strong> — 8M weekly downloads. Crypto-miner injected.
  </li>
  <li>
    <span class="year">2021</span>
    <strong>node-ipc</strong> — Protestware. Deleted files on Russian IPs.
  </li>
  <li>
    <span class="year">2024</span>
    <strong>polyfill.io</strong> — CDN sold. Malware served to 100k+ sites.
  </li>
  <li class="incident--critical">
    <span class="year">2026</span>
    <strong>axios</strong> — 300M weekly downloads. Account hijacked.
    RAT deployed cross-platform via postinstall hook.
    Spread to PyPI &amp; NuGet. CI/CD pipelines worldwide affected.
  </li>
</ul>

<p class="closing">
  This is not a question of <em>if</em>. It's a question of <em>when</em>.<br/>
  <strong>nullDeps. Zero packages. Zero attack surface.</strong>
</p>

  <p class="closing">
    These are not edge cases. They are the new normal.<br/>
    <strong>nullDeps ships zero registries, zero install steps, zero attack surface.</strong>
  </p>
</section>

      <section class="section">
        <h2>What it is</h2>
        <div class="code-block">
          <div class="code-header">
            <span class="code-dot"></span>
            <span class="code-dot"></span>
            <span class="code-dot"></span>
            <span class="code-file">project structure</span>
          </div>
          <pre><code>src/
  nulldeps.js        ← public API · single entry point
  core/
    component.js     ← base class · extends HTMLElement
    router.js        ← client-side routing
    store.js         ← reactive state
    http.js          ← fetch wrapper
    events.js        ← event bus

pages/
  home-page.js       ← extends Component
  about-page.js      ← extends Component</code></pre>
        </div>
        <p>
          <code>nulldeps.js</code> is just the public API – it re-exports everything 
          from <code>core/</code>. You import from one place, the modules stay separated.
        </p>
        <div class="code-block">
          <div class="code-header">
            <span class="code-dot"></span>
            <span class="code-dot"></span>
            <span class="code-dot"></span>
            <span class="code-file">nulldeps.js</span>
          </div>
          <pre><code>export { Component } from './core/component.js';
export { Store }     from './core/store.js';
export { Router }    from './core/router.js';
export { http }      from './core/http.js';
export { EventBus }  from './core/events.js';</code></pre>
        </div>
        <p>
          No installation. No <code>npm install</code>.
          No config file. You write a class.
          The browser understands it. Done.
        </p>
        <div class="code-block">
          <div class="code-header">
            <span class="code-dot"></span>
            <span class="code-dot"></span>
            <span class="code-dot"></span>
            <span class="code-file">my-page.js</span>
          </div>
          <pre><code>import { Component } from '/src/nulldeps.js';

class MyPage extends Component {
  template() {
    return \`
      &lt;h1&gt;That's all.&lt;/h1&gt;
    \`;
  }
}

customElements.define('my-page', MyPage);</code></pre>
        </div>
      </section>

      <section class="section">
        <h2>What you get</h2>
        <div class="feature-grid">
          <div class="feature-card highlight-card">
            <span class="feature-icon">⬡</span>
            <h3>0 Dependencies</h3>
            <p>The name is the promise.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🧩</span>
            <h3>Web Components</h3>
            <p>Native browser standard. No polyfill needed.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">⚡</span>
            <h3>Reactive State</h3>
            <p>setState() re-renders only what changed.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🔀</span>
            <h3>Routing</h3>
            <p>History API, clean URLs, no hash.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🎯</span>
            <h3>Actions</h3>
            <p>Event handling directly in HTML.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🌐</span>
            <h3>HTTP Client</h3>
            <p>fetch with a clean API.</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>What you don't get</h2>
        <ul class="not-list">
          <li><span class="not-icon">✗</span> A compiler that tells you what you did wrong</li>
          <li><span class="not-icon">✗</span> A bundler that takes 3 seconds to start</li>
          <li><span class="not-icon">✗</span> An abstraction layer on top of an abstraction layer</li>
          <li><span class="not-icon">✗</span> A breaking change in version 4.0 that rewrites everything</li>
        </ul>
      </section>

      <section class="section">
        <h2>Who it's for</h2>
        <div class="audience-list">
          <div class="audience-item">
            <span class="audience-arrow">→</span>
            <p>For developers who want to <strong>understand the web</strong> – not the framework.</p>
          </div>
          <div class="audience-item">
            <span class="audience-arrow">→</span>
            <p>For teams who will <strong>still know what their code does in 10 years</strong>.</p>
          </div>
          <div class="audience-item">
            <span class="audience-arrow">→</span>
            <p>For projects where <strong>performance is not an afterthought</strong>.</p>
          </div>
          <div class="audience-item">
            <span class="audience-arrow">→</span>
            <p>For anyone who once typed <code>npm install</code> and wondered if there was another way.</p>
          </div>
        </div>
      </section>

      <div class="closing">
        There is another way.
      </div>
    `;
  }

  styles() {
    return `
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #ccc;
        min-height: 100vh;
        padding: 4rem 1.5rem;
        box-sizing: border-box;
      }

      * {
        box-sizing: border-box;
      }

      .hero {
        text-align: center;
        margin-bottom: 4rem;
      }

      .hero-badge {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #6ee7b7;
        background: #0d1f18;
        border: 1px solid #1a3d2e;
        border-radius: 999px;
        padding: 0.3rem 0.85rem;
        margin-bottom: 1.5rem;
      }

      .hero-title {
        font-size: clamp(3rem, 10vw, 6rem);
        font-weight: 800;
        letter-spacing: -0.04em;
        color: #fff;
        margin: 0 0 1rem;
        line-height: 1;
      }

      .hero-sub {
        font-size: 1.1rem;
        color: #555;
        margin: 0;
        letter-spacing: 0.02em;
      }

      .intro {
        max-width: 640px;
        margin: 0 auto 3rem;
        text-align: center;
      }

      .lead {
        font-size: 1.1rem;
        color: #888;
        margin-bottom: 1.5rem;
      }

      blockquote {
        border-left: 2px solid #6ee7b7;
        margin: 0;
        padding: 0.75rem 1.5rem;
        color: #fff;
        font-size: 1.1rem;
        font-style: italic;
        text-align: left;
        background: #0d1f18;
        border-radius: 0 8px 8px 0;
      }

      .section {
        max-width: 720px;
        margin: 0 auto 3rem;
      }

      .section h2 {
        font-size: 1.3rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 1.25rem;
        letter-spacing: -0.02em;
      }

      .section p {
        color: #666;
        line-height: 1.8;
        margin-bottom: 1rem;
      }

      code {
        font-family: 'Fira Code', 'Cascadia Code', monospace;
        font-size: 0.85em;
        background: #141414;
        border: 1px solid #1e1e1e;
        border-radius: 4px;
        padding: 0.15em 0.4em;
        color: #6ee7b7;
      }

      pre code {
        background: none;
        border: none;
        padding: 0;
        font-size: 0.875rem;
        color: #ccc;
        line-height: 1.7;
      }

      .code-block {
        border: 1px solid #1e1e1e;
        border-radius: 10px;
        overflow: hidden;
        margin-top: 1.5rem;
      }

      .code-header {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.65rem 1rem;
        background: #0d0d0d;
        border-bottom: 1px solid #1e1e1e;
      }

      .code-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #2a2a2a;
      }

      .code-file {
        margin-left: auto;
        font-size: 0.75rem;
        color: #444;
        font-family: monospace;
      }

      pre {
        margin: 0;
        padding: 1.25rem;
        background: #0a0a0a;
        overflow-x: auto;
      }

      .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .feature-card {
        background: #0d0d0d;
        border: 1px solid #1e1e1e;
        border-radius: 10px;
        padding: 1.25rem;
        transition: border-color 0.2s;
      }

      .feature-card:hover {
        border-color: #2a2a2a;
      }

      .highlight-card {
        border-color: #1a3d2e;
        background: #0d1f18;
      }

      .feature-icon {
        display: block;
        font-size: 1.5rem;
        margin-bottom: 0.75rem;
      }

      .feature-card h3 {
        font-size: 0.9rem;
        font-weight: 600;
        color: #fff;
        margin-bottom: 0.5rem;
      }

      .feature-card p {
        font-size: 0.82rem;
        color: #555;
        margin: 0;
        line-height: 1.6;
      }

      .not-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .not-list li {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: #555;
        font-size: 0.95rem;
        padding: 0.75rem 1rem;
        background: #0d0d0d;
        border: 1px solid #1a1a1a;
        border-radius: 8px;
      }

      .not-icon {
        color: #3a3a3a;
        font-size: 1rem;
        flex-shrink: 0;
      }

      .audience-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .audience-item {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
      }

      .audience-arrow {
        color: #6ee7b7;
        flex-shrink: 0;
        margin-top: 0.1rem;
      }

      .audience-item p {
        margin: 0;
        color: #888;
      }

      .audience-item strong {
        color: #ccc;
      }

      .closing {
        text-align: center;
        margin-top: 4rem;
        padding-top: 3rem;
        border-top: 1px solid #1e1e1e;
        font-size: 1.5rem;
        font-weight: 700;
        color: #fff;
        letter-spacing: -0.02em;
        max-width: 720px;
        margin-left: auto;
        margin-right: auto;
      }

      @media (max-width: 480px) {
        .feature-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}

customElements.define('home-page', HomePage);
