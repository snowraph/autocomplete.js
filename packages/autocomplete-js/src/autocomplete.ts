import { createAutocomplete } from '@algolia/autocomplete-core';
import { createRef } from '@algolia/autocomplete-shared';

import { createAutocompleteDom } from './createAutocompleteDom';
import { createEffectWrapper } from './createEffectWrapper';
import { createReactiveWrapper } from './createReactiveWrapper';
import { defaultRenderer } from './defaultRenderer';
import { getPanelPositionStyle } from './getPanelPositionStyle';
import { render } from './render';
import {
  AutocompleteApi,
  AutocompleteOptions,
  AutocompletePanelPlacement,
  AutocompleteState,
  OnStageChange,
} from './types';
import { debounce, getHTMLElement, mergeDeep, setProperties } from './utils';

export function autocomplete<TItem>(
  rawOptions: AutocompleteOptions<TItem>
): AutocompleteApi<TItem> {
  const { runEffect, cleanupEffects, runEffects } = createEffectWrapper();
  const { reactive, runReactives } = createReactiveWrapper();

  const lastStateRef = createRef<AutocompleteState<TItem> | null>(null);
  const optionsRef = createRef(rawOptions);

  const autocomplete = reactive(() => {
    const apiOptions = {
      render: defaultRenderer,
      panelPlacement: 'input-wrapper-width',
      panelContainer: document.body,
      classNames: {},
      ...optionsRef.current,
    };
    const panelRoot = getHTMLElement(apiOptions.panelContainer);
    const onStateChange = createRef<OnStageChange<TItem> | undefined>(
      undefined
    );
    const api = createAutocomplete<TItem>({
      ...apiOptions,
      onStateChange(params) {
        onStateChange.current?.(params as any);
        apiOptions.onStateChange?.(params as any);
      },
    });
    onStateChange.current = debounce(({ state }) => {
      render(apiOptions.render, {
        state,
        ...autocomplete.current.api,
        classNames: apiOptions.classNames,
        panelRoot,
        root: autocomplete.current.dom.root,
        form: autocomplete.current.dom.form,
        input: autocomplete.current.dom.input,
        inputWrapper: autocomplete.current.dom.inputWrapper,
        label: autocomplete.current.dom.label,
        panel: autocomplete.current.dom.panel,
        resetButton: autocomplete.current.dom.resetButton,
      });
    }, 0);
    const dom = createAutocompleteDom({
      ...api,
      classNames: apiOptions.classNames,
    });

    return {
      api,
      dom,
      options: apiOptions,
    };
  });

  function setPanelPosition() {
    setProperties(autocomplete.current.dom.panel, {
      style: getPanelPositionStyle({
        panelPlacement: autocomplete.current.options
          .panelPlacement as AutocompletePanelPlacement,
        container: autocomplete.current.dom.root,
        inputWrapper: autocomplete.current.dom.inputWrapper,
        environment: autocomplete.current.options.environment,
      }),
    });
  }

  runEffect(() => {
    const environmentProps = autocomplete.current.api.getEnvironmentProps({
      searchBoxElement: autocomplete.current.dom.form,
      panelElement: autocomplete.current.dom.panel,
      inputElement: autocomplete.current.dom.input,
    });

    setProperties(window as any, environmentProps);

    return () => {
      setProperties(
        window as any,
        Object.keys(environmentProps).reduce((acc, key) => {
          return {
            ...acc,
            [key]: undefined,
          };
        }, {})
      );
    };
  });

  runEffect(() => {
    const containerElement = getHTMLElement(
      autocomplete.current.options.container
    );
    const panelElement = getHTMLElement(
      autocomplete.current.options.panelContainer
    );
    containerElement.appendChild(autocomplete.current.dom.root);

    return () => {
      containerElement.removeChild(autocomplete.current.dom.root);
      if (panelElement.contains(autocomplete.current.dom.panel)) {
        panelElement.removeChild(autocomplete.current.dom.panel);
      }
    };
  });

  runEffect(() => {
    const onResize = debounce<Event>(() => {
      setPanelPosition();
    }, 20);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  });

  runEffect(() => {
    requestAnimationFrame(() => {
      setPanelPosition();
    });

    return () => {};
  });

  function destroy() {
    cleanupEffects();
  }

  function update(updatedOptions: Partial<AutocompleteOptions<TItem>> = {}) {
    cleanupEffects();

    optionsRef.current = mergeDeep(
      { initialState: { ...lastStateRef.current } },
      autocomplete.current.options,
      updatedOptions
    );

    runReactives();
    runEffects();

    autocomplete.current.api.refresh();
  }

  return {
    setSelectedItemId: autocomplete.current.api.setSelectedItemId,
    setQuery: autocomplete.current.api.setQuery,
    setCollections: autocomplete.current.api.setCollections,
    setIsOpen: autocomplete.current.api.setIsOpen,
    setStatus: autocomplete.current.api.setStatus,
    setContext: autocomplete.current.api.setContext,
    refresh: autocomplete.current.api.refresh,
    destroy,
    update,
  };
}
