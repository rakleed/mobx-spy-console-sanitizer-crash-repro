import './mobx-spy-console-hook-repro';

import * as mobx from 'mobx';
import {
  action,
  computed,
  makeAutoObservable,
  makeObservable,
  observable,
  runInAction,
  toJS,
} from 'mobx';
import { observer } from 'mobx-react-lite';
import { createRoot } from 'react-dom/client';

window.__MOBX_DEVTOOLS_GLOBAL_HOOK__?.injectMobx(mobx);

class AutoObservableCounterStore {
  count = 0;

  user = {
    name: 'Pavel',
    stats: {
      clicks: 0,
    },
  };

  constructor() {
    makeAutoObservable(this);
  }

  increment() {
    this.count += 1;
    this.user.stats.clicks += 1;
  }
}

class ObservableTodoStore {
  todos = [
    {
      id: 1,
      title: 'Initial observable todo',
      done: false,
    },
  ];

  filter = 'all';

  constructor() {
    makeObservable(this, {
      todos: observable,
      filter: observable,
      visibleTodos: computed,
      addTodo: action,
      toggleFirstTodo: action,
      setFilter: action,
    });
  }

  get visibleTodos() {
    if (this.filter === 'done') {
      return this.todos.filter((todo) => todo.done);
    }

    if (this.filter === 'active') {
      return this.todos.filter((todo) => !todo.done);
    }

    return this.todos;
  }

  addTodo() {
    this.todos.push({
      id: Date.now(),
      title: `Observable todo ${this.todos.length + 1}`,
      done: false,
    });
  }

  toggleFirstTodo() {
    const [firstTodo] = this.todos;

    if (firstTodo) {
      firstTodo.done = !firstTodo.done;
    }
  }

  setFilter(filter: 'all' | 'active' | 'done') {
    this.filter = filter;
  }
}

const autoObservableCounterStore = new AutoObservableCounterStore();
const observableTodoStore = new ObservableTodoStore();

function runBatchAction() {
  runInAction('update stores with runInAction', () => {
    autoObservableCounterStore.count += 10;
    autoObservableCounterStore.user.name = `Pavel ${autoObservableCounterStore.count}`;
    autoObservableCounterStore.user.stats.clicks += 10;

    observableTodoStore.todos.push({
      id: Date.now(),
      title: `runInAction todo ${observableTodoStore.todos.length + 1}`,
      done: false,
    });
    observableTodoStore.filter = observableTodoStore.filter === 'all' ? 'active' : 'all';
  });
}

function logSnapshots() {
  console.log('autoObservableCounterStore toJS', toJS(autoObservableCounterStore));
  console.log('observableTodoStore.todos toJS', toJS(observableTodoStore.todos));
  console.log('observableTodoStore.visibleTodos toJS', toJS(observableTodoStore.visibleTodos));
}

const App = observer(() => (
  <main style={{ display: 'grid', gap: 12, padding: 24 }}>
    <section>
      <h2>makeAutoObservable</h2>
      <button onClick={() => autoObservableCounterStore.increment()}>
        Count: {autoObservableCounterStore.count}, clicks: {autoObservableCounterStore.user.stats.clicks}
      </button>
      <div>User: {autoObservableCounterStore.user.name}</div>
    </section>

    <section>
      <h2>makeObservable</h2>
      <div>Filter: {observableTodoStore.filter}</div>
      <div>Visible todos: {observableTodoStore.visibleTodos.length}</div>
      <button onClick={() => observableTodoStore.addTodo()}>Add observable todo</button>
      <button onClick={() => observableTodoStore.toggleFirstTodo()}>Toggle first todo</button>
      <button onClick={() => observableTodoStore.setFilter('all')}>Show all</button>
      <button onClick={() => observableTodoStore.setFilter('active')}>Show active</button>
      <button onClick={() => observableTodoStore.setFilter('done')}>Show done</button>
      <ul>
        {observableTodoStore.visibleTodos.map((todo) => (
          <li key={todo.id}>
            {todo.title}: {todo.done ? 'done' : 'active'}
          </li>
        ))}
      </ul>
    </section>

    <section>
      <h2>runInAction / toJS</h2>
      <button onClick={runBatchAction}>Run batch action</button>
      <button onClick={logSnapshots}>Log toJS snapshots</button>
    </section>
  </main>
));

createRoot(document.getElementById('root')!).render(<App />);
