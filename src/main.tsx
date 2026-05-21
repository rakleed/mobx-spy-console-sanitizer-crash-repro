import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { createRoot } from "react-dom/client";

class CounterStore {
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment() {
    this.count += 1;
  }
}

const store = new CounterStore();

const App = observer(() => (
  <button onClick={() => store.increment()}>
    Count: {store.count}
  </button>
));

createRoot(document.getElementById("root")!).render(<App />);
