/*eslint-disable no-console */
import React from 'react';
import ReactDOM from 'react-dom';

import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import { ShortCircuitProvider, createContainer } from 'short-circuit';

import {
    SHORT_CIRCUIT_CACHE,
    cacheReducer,
    createResolverFactory } from './shortCircuit';
import DevTools from './DevTools';

const store = createStore(combineReducers({
    [SHORT_CIRCUIT_CACHE]: cacheReducer
}), {}, DevTools.instrument());
const resourceResolverFactory = createResolverFactory(store);

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

const TodoList = createContainer(
    () => ({
        'todos': {
            resourceType: 'todo',
            collection: true
        }
    })
)(function TodoList(props){
    return <ul>
        { props.todos.map((todo)=>
            <li key={todo.id}>
                <Todo id={todo.id}/>
            </li>
        )}
        </ul>;
});


ReactDOM.render(
    <Provider store={store}>
      <ShortCircuitProvider
        subscribe={store.subscribe}
        createResolve={resourceResolverFactory} >
        <div>
            <h1>Todos</h1>
            <TodoList />
            <DevTools />
        </div>
      </ShortCircuitProvider>
    </Provider>,
    document.getElementById('example')
);
