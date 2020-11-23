import { createEffectWrapper } from '../createEffectWrapper';

describe('createEffectWrapper', () => {
  test('runs the effects and their cleanups', () => {
    const { runEffect, cleanupEffects, runEffects } = createEffectWrapper();
    const cleanup1 = jest.fn();
    const cleanup2 = jest.fn();
    const effect1 = jest.fn(() => cleanup1);
    const effect2 = jest.fn(() => cleanup2);

    runEffect(effect1);
    runEffect(effect2);

    expect(effect1).toHaveBeenCalledTimes(1);
    expect(effect2).toHaveBeenCalledTimes(1);
    expect(cleanup1).toHaveBeenCalledTimes(0);
    expect(cleanup2).toHaveBeenCalledTimes(0);

    cleanupEffects();

    expect(effect1).toHaveBeenCalledTimes(1);
    expect(effect2).toHaveBeenCalledTimes(1);
    expect(cleanup1).toHaveBeenCalledTimes(1);
    expect(cleanup2).toHaveBeenCalledTimes(1);

    runEffects();

    expect(effect1).toHaveBeenCalledTimes(2);
    expect(effect2).toHaveBeenCalledTimes(2);
    expect(cleanup1).toHaveBeenCalledTimes(1);
    expect(cleanup2).toHaveBeenCalledTimes(1);

    cleanupEffects();

    expect(effect1).toHaveBeenCalledTimes(2);
    expect(effect2).toHaveBeenCalledTimes(2);
    expect(cleanup1).toHaveBeenCalledTimes(2);
    expect(cleanup2).toHaveBeenCalledTimes(2);
  });
});
