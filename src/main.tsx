import * as mobx from 'mobx';
import { $mobx, makeAutoObservable } from 'mobx';
import { createRoot } from 'react-dom/client';

import { injectMobxIntoUnsafeHook } from './mobx-spy-console-hook-repro';

injectMobxIntoUnsafeHook(mobx);

type MobxAdministrationWithValues = {
  values_: Map<string, unknown>;
};

class SiteMapStore {
  map = new Map([['home', '/']]);
  tick = 0;

  constructor() {
    makeAutoObservable(this);
    (this as unknown as { [$mobx]: MobxAdministrationWithValues })[$mobx].values_.delete('map');
  }

  triggerUnsafeSanitizeCrash() {
    this.tick += 1;
  }
}

const siteMapStore = new SiteMapStore();

function App() {
  return (
    <main style={{ padding: 24 }}>
      <button onClick={() => siteMapStore.triggerUnsafeSanitizeCrash()}>Trigger unsafe sanitize crash</button>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
