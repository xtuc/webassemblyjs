// @flow

const STOP = Symbol("STOP");

type State<T> = T | Symbol;
type TransitionEdge<Q> = () => [Q, number] | false;
type TransitionFunction<Q> = () => [Q, number];
type TransitionList<Q> = { [Q]: Array<TransitionEdge<Q>> };

function makeTransition<Q>(
  regex: RegExp,
  nextState: Q,
  // $FlowIgnore
  { n = 1, allowedSeparator } = {}
): TransitionEdge<Q> {
  return function() {
    if (allowedSeparator) {
      if (this.input[this.ptr] === allowedSeparator) {
        if (regex.test(this.input.substring(this.ptr - 1, this.ptr))) {
          // Consume the separator and stay in current state
          return [this.currentState, 1];
        } else {
          return [this.terminatingState, 0];
        }
      }
    }

    if (regex.test(this.input.substring(this.ptr, this.ptr + n))) {
      return [nextState, n];
    }

    return false;
  };
}

function combineTransitions<Q>(
  transitions: TransitionList<Q>
): TransitionFunction<Q> {
  return function() {
    let match = false;
    const currentTransitions = transitions[this.currentState] || [];

    for (let i = 0; i < currentTransitions.length; ++i) {
      match = currentTransitions[i].call(this);
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
  transitionFunction: TransitionFunction<State<T>>;

  constructor(
    transitions: TransitionList<State<T>>,
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
