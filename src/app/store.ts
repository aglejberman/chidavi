export type Listener<S> = (state: S) => void;

/** Almacén de estado mínimo: estado inmutable + reductor + suscriptores. */
export interface Store<S, A> {
  readonly getState: () => S;
  readonly dispatch: (action: A) => void;
  readonly subscribe: (listener: Listener<S>) => () => void;
}

export function createStore<S, A>(
  initialState: S,
  reducer: (state: S, action: A) => S,
): Store<S, A> {
  let state = initialState;
  const listeners = new Set<Listener<S>>();

  return {
    getState: () => state,
    dispatch: (action) => {
      const next = reducer(state, action);
      if (next === state) return;
      state = next;
      listeners.forEach((listener) => {
        listener(state);
      });
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
