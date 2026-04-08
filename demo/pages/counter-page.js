import { Component } from '/src/nulldeps.js';

class CounterPage extends Component {
  // Initialize state
  onMount() {
     this.initState({ count: 0 });
  }

  // Called via data-action="click:increment"
  increment() {
    this.setState({ count: this.state.count + 1 });
  }

  decrement() {
    this.setState({ count: this.state.count - 1 });
  }

  reset() {
    this.setState({ count: 0 });
  }

  template() {
    const { count } = this.state;
    return `
      <div class="counter">
        <h2>Counter</h2>
        <div class="display">${count}</div>
        <div class="controls">
          <ui-button variant="secondary" data-action="click:decrement">-</ui-button>
          <ui-button data-action="click:reset">Reset</ui-button>
          <ui-button variant="secondary" data-action="click:increment">+</ui-button>
        </div>
      </div>
    `;
  }

  styles() {
    return `
      .counter { padding: 2rem 0; text-align: center; }
      h2 { font-size: 1.5rem; margin-bottom: 2rem; color: #fff; }
      .display {
        font-size: 5rem;
        font-weight: bold;
        color: #6ee7b7;
        margin-bottom: 2rem;
      }
      .controls { display: flex; gap: 1rem; justify-content: center; }
     
    `;
  }
}

customElements.define('counter-page', CounterPage);
