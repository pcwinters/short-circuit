# short-circuit
Short Circuit Flux/React Data Management

## Concepts
* `resolve` - A strategy for resolving data for the queries declared by containers. Typically
this will both fetch from your API and manage cache update actions.
* Queries and Args - Containers define their data requirements with respect to:
  * `args(props): Object`) A transformation of props that affect changes in your container's query requirements. Args are optional, because queries can be computed directly from props. But, args will be spread as props along the same lifecycle as the data resolved for queries. In this way, you can be sure that certain props (like id's or filters) that are tightly coupled to queries are updated when the associated data is loaded.
  * `queries(args): Object`) A function that returns a anything that you know how to resolve. An example would be a map of prop/query pairs (the query schema for which should be understood by your resolve function.
* Containers - A container represents a component in your React tree that describes and resolves
data requirements in the form of queries.
  * Root containers - Root containers react to prop/arg changes as well as store changes (via `subscribe`) in order to resolve data for the containers declared queries. Both the resolved data as well as lifecycle information like pending args, failure states, and ready state are made accessible via context. Varying behaviors can be built around the state that root containers expose (loading indicators, failure messages, etc.)

## API

### `<ShortCircuitProvider subscribe [resolve] [createResolve]>`
Short Circuit requires a provider (usually close to the root of your application tree), similar to the [react-redux `<Provider>`](https://github.com/rackt/react-redux/blob/master/docs/api.md#provider-store).
The provider's purpose is to expose an api to containers (_through context_), binding
them to a store updates (redux or otherwise) and a function for resolving data queries.

### `createRootContainer(options)`
Root containers are created from specifications of data requirements and maintain
and expose state about data fetch. They request data to be resolved using the
adapter and store bindings made accessible to them by the Adrenaline Provider,
and react to prop changes.

Options can be one of the following:
* `function(props)` - Through which query requirements are computed directly from props.
* `Object` - An object
  * `args(props): Object` - A function returning props that should be treated as args to
  your queries and exposed by containers for gating prop changes along the data resolution lifecycle.
  * `queries(props): Object` - The queries function.
#

### `createContainer(options) : Function`
An es7 compatible decorator that will wrap a target component and spread data
props from a coupled root container.


## Examples
### Resolve, Reduce, Store
The following demonstrates how a short-circuit provider for resolving resources
from an API by ID can be built and installed with redux.
```js
import { createStore, combineReducers} from 'redux';
import { createAction, handleActions } from 'react-redux';
import { Provider } from 'react-redux';
import { ShortCircuitReduxProvider } from 'short-circuit';

// CACHE UPDATE ACTION, REDUCER, and STORE
const SHORT_CIRCUIT_CACHE_UPDATE_ACTION = 'SHORT_CIRCUIT_CACHE_UPDATE_ACTION';
const shortCircuitUpdateActionCreator = createAction(SHORT_CIRCUIT_CACHE_UPDATE_ACTION);
const shortCircuitCacheReducer = handleAction(SHORT_CIRCUIT_CACHE_UPDATE_ACTION, (state={}, action)=>{
    const { resourceType, resource } = action.payload;
    let resourceCache = state[resourceType] || {};
    resourceCache = Object.assign({}, resourceCache, {
        [resource.id]: resource
    });
    return Object.assign({}, state, {
        [resourceType]: resourceCache
    });
});
const SHORT_CIRCUIT_CACHE = 'SHORT_CIRCUIT_CACHE';
const store = createStore(combineReducers({
  [SHORT_CIRCUIT_CACHE]: shortCircuitCacheReducer
}));

// The short-circuit resolve function
const resourceResolver = function(queries) {
    return new Promise((resolve, reject)=>{
        const cache = store.getState()[SHORT_CIRCUIT_CACHE];
        const allQueryPromises = queries.entries().map( ([prop, query])=> {
            const isInCache = typeof (cache[query.resourceType]||{})[query.resource.id] !== 'undefined';
            return isInCache ?
                // cache hit
                Promise.resolve([ prop, cache[query.resourceType][query.resource.id] ]) :
                // api fetch and dispatch cache update before resolving
                fetch(`/api/${query.resourceType}/${query.resource.id}`)
                    .then((response) => response.json())
                    .then((resource) => {
                        shortCircuitUpdateActionCreator({
                            resourceType,
                            resource
                        });
                        return [ prop, resource ]
                    });
            );
        });
        resolve(
            Promise.all(allQueryPromises).then((entries) => {
                const data = {};
                entries.forEach(([ prop, resource ]) => data[prop]=resource );
                return data;
            })
        );
    });
};

ReactDOM.render(
  <Provider store={store}>
    <ShortCircuitReduxProvider
      subscribe={store.subscribe}
      resolve={resourceResolver} >
      { /* Your application */ }
      
    </ShortCircuitReduxProvider>
  </Provider>
  , document.body);
```
