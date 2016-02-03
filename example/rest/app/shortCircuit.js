import { createAction, handleActions } from 'redux-actions';
import { map, has, get, values, partial } from 'lodash';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import stringify from 'json-stable-stringify';

// CACHE UPDATE ACTION, REDUCER, and STORE
const SHORT_CIRCUIT_UPDATE_CACHE_ACTION = 'SHORT_CIRCUIT_UPDATE_CACHE_ACTION';
const updateCacheActionCreator = createAction(SHORT_CIRCUIT_UPDATE_CACHE_ACTION);

const cacheReducer = handleActions({
    [SHORT_CIRCUIT_UPDATE_CACHE_ACTION]: (state={}, action)=>{
        const { resourceType, resource } = action.payload;
        let resourceCache = state[resourceType] || {};
        resourceCache = Object.assign({}, resourceCache, {
            [resource.id]: resource
        });
        return Object.assign({}, state, {
            [resourceType]: resourceCache
        });
    }
}, {});

const SHORT_CIRCUIT_CACHE = 'SHORT_CIRCUIT_CACHE';

function resolveResource(store, resourceType, resource){
    const cache = store.getState()[SHORT_CIRCUIT_CACHE];
    const cachePath = `${resourceType}.${resource.id}`;
    const isInCache = has(cache, cachePath);
    return isInCache ?
        // cache hit
        Promise.resolve(get(cache, cachePath)) :
        // api fetch and dispatch cache update before resolving
        fetch(`/api/${resourceType}/${resource.id}`)
            .then((response) => response.json())
            .then((resource) => {
                store.dispatch(updateCacheActionCreator({
                    resourceType,
                    resource
                }));
                return resource;
            });
}

function resolveCollection(store, resourceType){
    const cache = store.getState()[SHORT_CIRCUIT_CACHE];
    const cachePath = `${resourceType}`;
    const isInCache = has(cache, cachePath);
    return isInCache ?
        // cache hit
        Promise.resolve(values(get(cache, cachePath))) :
        // api fetch and dispatch cache update before resolving
        fetch(`/api/${resourceType}`)
            .then((response) => response.json())
            .then((resources) => {
                resources.forEach((resource )=>{
                    store.dispatch(updateCacheActionCreator({
                        resourceType,
                        resource
                    }));
                });
                return resources;
            });
}

function resolve(store, queries) {
    return new Promise((resolve) => {
        const allQueryPromises = map(queries, (query, prop) => {
            const { resourceType, resource, collection } = query;
            if(resource){
                return resolveResource(store, resourceType, resource)
                    .then((resource) => [prop, resource]);
            } else if (collection) {
                return resolveCollection(store, resourceType)
                    .then((collection) => [prop, collection]);
            }
        });
        resolve(
            Promise.all(allQueryPromises).then((entries) => {
                const data = {};
                entries.forEach(([ prop, value ]) => data[prop]=value );
                return data;
            })
        );
    });
}
// create a "selector creator" that uses lodash.isEqual instead of ===
const createHashedSelector = createSelectorCreator(
  defaultMemoize,
  (value, other) => {
      return value === other ||
        stringify(value) == stringify(other);
  }
);

function createResolverFactory(store){
    return function resolverFactory(){
        return createHashedSelector(
            (queries) => queries,
            () => store.getState()[SHORT_CIRCUIT_CACHE],
            // The short-circuit resolve function
            partial(resolve, store)
        );
    };
}
export {
    SHORT_CIRCUIT_CACHE,
    cacheReducer,
    createResolverFactory
};
