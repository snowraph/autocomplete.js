export function createRef<TValue>(initialValue: TValue): Ref<TValue> {
  return {
    current: initialValue,
  };
}
