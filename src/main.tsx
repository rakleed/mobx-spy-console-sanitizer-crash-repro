import './mobx-spy-console-hook-repro';

import * as mobx from 'mobx';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { createRoot } from 'react-dom/client';

window.__MOBX_DEVTOOLS_GLOBAL_HOOK__?.injectMobx(mobx);

class CounterStore {
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

const store = new CounterStore();

const App = observer(() => (
  <button onClick={() => store.increment()}>
    Count: {store.count}, clicks: {store.user.stats.clicks}
  </button>
));

createRoot(document.getElementById('root')!).render(<App />);
