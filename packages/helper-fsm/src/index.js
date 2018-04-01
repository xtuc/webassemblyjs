// @flow

const STOP = Symbol("STOP");

type State<T> = T | Symbol;
type TransitionEdge<T> = (FSM<T>) => [State<T>, number] | false;
type TransitionFunction<T> = () => [State<T>, number];
type TransitionList<T> = { [State<T>]: Array<TransitionEdge<T>> };

type transitionFactoryOpts = {
  n?: number,
  allowedSeparator?: string
};

function makeTransition<T>(
  regex: RegExp,
  nextState: State<T>,
  { n = 1, allowedSeparator }: transitionFactoryOpts = {}
): TransitionEdge<T> {
  return function(instance: FSM<T>) {
    if (allowedSeparator) {
      if (instance.input[instance.ptr] === allowedSeparator) {
        if (
          regex.test(instance.input.substring(instance.ptr - 1, instance.ptr))
        ) {
          // Consume the separator and stay in current state
          return [instance.currentState, 1];
        } else {
          return [instance.terminatingState, 0];
        }
      }
    }

    if (regex.test(instance.input.substring(instance.ptr, instance.ptr + n))) {
      return [nextState, n];
    }

    return false;
  };
}

function combineTransitions<T>(
  transitions: TransitionList<T>
): TransitionFunction<T> {
  return function() {
    let match = false;
    const currentTransitions = transitions[this.currentState] || [];

    for (let i = 0; i < currentTransitions.length; ++i) {
      match = currentTransitions[i](this);
      if (match !== false) {
        break;
      }
    }

    return match || [this.terminatingState, 0];
  };
}

class FSM<T> {
  initialState: State<T>;
  currentState: State<T>;
  terminatingState: State<T>;
  input: string;
  ptr: number;
  transitionFunction: TransitionFunction<T>;

  constructor(
    transitions: TransitionList<T>,
    initialState: State<T>,
    terminatingState: State<T> = STOP
  ) {
    this.initialState = initialState;
    this.terminatingState = terminatingState;

    if (terminatingState === STOP || !transitions[terminatingState]) {
      transitions[terminatingState] = [];
    }

    this.transitionFunction = combineTransitions.call(this, transitions);
  }

  run(input: string): string {
    this.input = input;
    this.ptr = 0;
    this.currentState = this.initialState;

    let value = "";
    let eatLength: number, nextState: State<T>;

    while (
      this.currentState !== this.terminatingState &&
      this.ptr < this.input.length
    ) {
      [nextState, eatLength] = this.transitionFunction();
      value += this.input.substring(this.ptr, (this.ptr += eatLength));
      this.currentState = nextState;
    }

    return value;
  }
}

export { makeTransition, FSM };
