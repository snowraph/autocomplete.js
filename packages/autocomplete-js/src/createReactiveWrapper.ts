type ReactiveValue<TValue> = () => TValue;
type Reactive<TValue> = {
  current: TValue;
  /**
   * @private
   */
  fn: ReactiveValue<TValue>;
  /**
   * @private
   */
  ref: {
    current: TValue;
  };
};

export function createReactiveWrapper() {
  const reactives: Array<Reactive<any>> = [];

  return {
    reactive<TValue>(value: ReactiveValue<TValue>) {
      const reactive: Reactive<TValue> = {
        fn: value,
        ref: { current: value() },
        get current() {
          return this.ref.current;
        },
        set current(value) {
          this.ref.current = value;
        },
      };

      reactives.push(reactive);

      return reactive;
    },
    runReactives() {
      reactives.forEach((value) => {
        value.ref.current = value.fn();
      });
    },
  };
}
