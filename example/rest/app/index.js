/*eslint-disable no-console */
import React from 'react';
import ReactDOM from 'react-dom';

import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import { ShortCircuitProvider, createContainer } from 'short-circuit';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { isEqual } from 'lodash';

// create a "selector creator" that uses lodash.isEqual
const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  isEqual
);

import {
    SHORT_CIRCUIT_CACHE,
    cacheReducer,
    createResolverFactory } from './shortCircuit';
import DevTools from './DevTools';

const store = createStore(combineReducers({
    [SHORT_CIRCUIT_CACHE]: cacheReducer
}), {}, DevTools.instrument());
const resourceResolverFactory = createResolverFactory(store);

/**
 * A container that resolves a Todo with the given prop id.
 */
const Todo = createContainer(
    (props) => ({
        'todo': {
            resourceType: 'todo',
            resource: { id: props.id }
        }
    })
)(function Todo(props){
    const { todo } = props;
    return <div>{ todo.message }</div>;
});

/**
 * This advanced example demonstrates a container that must chain resolution in
 * order to determine the number of Todos to query for. Another use case might
 * involve foreign key relationships that require resolving multiple queries in
 * order to commit the containers state.
 */
const TodoList = createContainer({
    args: ({userId, offset}) => ({
        userId,
        offset
    }),
    queries: createDeepEqualSelector(
        (args) => args,
        (args, resolve) => resolve,
        (args, resolve) => {
            const userPreference = {
                resourceType: 'userPreference',
                resource: {
                    id: args.userId
                }
            };
            // Ultimately, the promises are exploded and the final resolved value
            // is treated as the queries result.
            return resolve({
                userPreference
            })
                /* eslint no-unused-vars: 0 */
                /* resolve is fully chainable. */
                .then(data => ({
                    userPreference,
                    'todos': {
                        resourceType: 'todo',
                        collection: {
                            limit: data.userPreference.limit,
                            offset: args.offset
                        }
                    }
                }));

        }
    )
})(function TodoList(props){
    return (
        <div>
            <div>Limit: {props.userPreference.limit}</div>
            <ul>
                { props.todos.map((todo)=>
                    <li key={todo.id}>
                        <Todo id={todo.id}/>
                    </li>
                )}
            </ul>
        </div>
    );
});


ReactDOM.render(
    <Provider store={store}>
      <ShortCircuitProvider
        subscribe={store.subscribe}
        createResolve={resourceResolverFactory} >
        <div>
            <h1>Todos</h1>
            <TodoList userId={1} offset={0} />
            <DevTools />
        </div>
      </ShortCircuitProvider>
    </Provider>,
    document.getElementById('example')
);
