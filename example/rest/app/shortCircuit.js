import { createAction, handleActions } from 'redux-actions';
import { map, has, get, values, partial, isEqual, slice, chain } from 'lodash';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import warning from 'warning';
import stringify from 'json-stable-stringify';

// create a "selector creator" that uses lodash.isEqual instead of ===
const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  isEqual
);

// CACHE UPDATE ACTION, REDUCER, and STORE
const SHORT_CIRCUIT_UPDATE_CACHE_ACTION = 'SHORT_CIRCUIT_UPDATE_CACHE_ACTION';
const updateCacheActionCreator = createAction(SHORT_CIRCUIT_UPDATE_CACHE_ACTION);

const cacheReducer = handleActions({
    [SHORT_CIRCUIT_UPDATE_CACHE_ACTION]: (state={}, action)=>{
        const { resourceType, resource, resources } = action.payload;
        let theResourceCache = state[resourceType] || {};

        const cacheAResource = (resourceToCache) => {
            theResourceCache = Object.assign({}, theResourceCache, {
                [resourceToCache.id]: resourceToCache
            });
        };
        chain(resources)
            .concat(resource)
            .compact()
            .each(cacheAResource)
            .value();

        return Object.assign({}, state, {
            [resourceType]: theResourceCache
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

function resolveCollection(store, resourceType, collection){
    const cache = store.getState()[SHORT_CIRCUIT_CACHE];
    const cachePath = `${resourceType}`;
    const isInCache = has(cache, cachePath);
    // TODO determine if the cache can serve the collection params
    return isInCache ?
        // cache hit
        Promise.resolve(
            slice(
                values(get(cache, cachePath)),
                collection.offset,
                collection.offset+collection.limit
            )
        ) :
        // api fetch and dispatch cache update before resolving
        fetch(`/api/${resourceType}`, {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(collection)
        })
            .then((response) => response.json())
            .then((resources) => {
                store.dispatch(updateCacheActionCreator({
                    resourceType,
                    resources,
                    collection
                }));
                return resources;
            });
}

function resolve(store, queries) {
    warning(false, 'resolve %s', stringify(queries));
    return new Promise((resolve) => {
        const allQueryPromises = map(queries, (query, prop) => {
            const { resourceType, resource, collection } = query;
            if(resource){
                return resolveResource(store, resourceType, resource)
                    .then((resource) => [prop, resource]);
            } else if (collection) {
                return resolveCollection(store, resourceType, collection)
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

function createResolverFactory(store){
    return function resolverFactory(){
        return createDeepEqualSelector(
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
