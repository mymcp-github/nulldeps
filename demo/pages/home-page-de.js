// home-page.js - NullDeps framework landing/documentation page
import { Component } from '/src/nulldeps.js';

class HomePage extends Component {
  template() {
    return `
      <div class="hero">
        <div class="hero-badge">v1.0 · Zero Dependencies</div>
        <h1 class="hero-title">NullDeps</h1>
        <p class="hero-sub">Kein Build. Kein Bundle. Kein Bullshit.</p>
      </div>

      <div class="intro">
        <p class="lead">
          NullDeps ist ein Web-Framework das auf eine einzige Überzeugung gebaut ist:
        </p>
        <blockquote>
          Der Browser ist bereits ein Framework. Du brauchst kein weiteres.
        </blockquote>
      </div>

      <section class="section">
        <h2>Warum NullDeps existiert</h2>
        <p>
          Irgendwann zwischen 2015 und heute ist etwas schiefgelaufen.
        </p>
        <p>
          Wir haben angefangen, Frameworks zu installieren um Frameworks zu benutzen 
          um Frameworks zu abstrahieren – nur um am Ende einen <code>node_modules</code>-Ordner 
          mit 847 Paketen zu haben, die eine Seite rendern die "Hello World" sagt.
        </p>
        <p>
          Wir haben Build-Steps akzeptiert als wären sie Naturgesetze. Wir haben 
          TypeScript-Compiler, Vite-Configs, Babel-Plugins und Tree-Shaking-Strategien 
          als <em>selbstverständlich</em> behandelt – und vergessen zu fragen:
          <strong>Wofür eigentlich?</strong>
        </p>
        <p>NullDeps ist die Antwort auf diese Frage.</p>
      </section>

      <section class="section">
        <h2>Was es ist</h2>
        <p>Eine einzige Datei. <code>nulldeps.js</code>.</p>
        <p>
          Keine Installation. Kein <code>npm install</code>. 
          Kein Konfigurationsfile. Du schreibst eine Klasse. 
          Der Browser versteht sie. Fertig.
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
      &lt;h1&gt;Das ist alles.&lt;/h1&gt;
    \`;
  }
}

customElements.define('my-page', MyPage);</code></pre>
        </div>
      </section>

      <section class="section">
        <h2>Was du bekommst</h2>
        <div class="feature-grid">
          <div class="feature-card highlight-card">
            <span class="feature-icon">⬡</span>
            <h3>0 Dependencies</h3>
            <p>Der Name ist das Versprechen.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🧩</span>
            <h3>Web Components</h3>
            <p>Nativer Browser-Standard. Kein Polyfill nötig.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">⚡</span>
            <h3>Reaktives State</h3>
            <p>setState() rendert nur was sich ändert.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🔀</span>
            <h3>Routing</h3>
            <p>History API, saubere URLs, kein Hash.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🎯</span>
            <h3>Actions</h3>
            <p>Event-Handling direkt im HTML.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🌐</span>
            <h3>HTTP-Client</h3>
            <p>fetch mit sauberer API.</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Was du nicht bekommst</h2>
        <ul class="not-list">
          <li><span class="not-icon">✗</span> Einen Compiler der dir sagt was du falsch machst</li>
          <li><span class="not-icon">✗</span> Einen Bundler der 3 Sekunden braucht</li>
          <li><span class="not-icon">✗</span> Eine Abstraktionsschicht über der Abstraktionsschicht</li>
          <li><span class="not-icon">✗</span> Eine Breaking Change in Version 4.0 die alles umbaut</li>
        </ul>
      </section>

      <section class="section">
        <h2>Für wen es ist</h2>
        <div class="audience-list">
          <div class="audience-item">
            <span class="audience-arrow">→</span>
            <p>Für Entwickler die <strong>das Web verstehen wollen</strong> – nicht das Framework.</p>
          </div>
          <div class="audience-item">
            <span class="audience-arrow">→</span>
            <p>Für Teams die <strong>in 10 Jahren noch wissen</strong> was ihr Code tut.</p>
          </div>
          <div class="audience-item">
            <span class="audience-arrow">→</span>
            <p>Für Projekte wo <strong>Performance kein nachträglicher Gedanke</strong> ist.</p>
          </div>
          <div class="audience-item">
            <span class="audience-arrow">→</span>
            <p>Für jeden der einmal <code>npm install</code> getippt hat und sich gefragt hat ob es auch anders geht.</p>
          </div>
        </div>
      </section>

      <div class="closing">
        Es geht anders.
      </div>
    `;
  }

  styles() {
    return `
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #080808;
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
