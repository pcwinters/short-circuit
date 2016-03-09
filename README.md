# short-circuit
Short circuit is a Flux/React strategy for managing data bindings to components. It helps you write *"data driven React applications"* a la Facebook's [Relay](https://facebook.github.io/relay/), but allows you to model any resolution strategy (GraphQL or otherwise). Born from ideas cemented in another library [Adrenaline](https://github.com/gyzerok/adrenaline), short-circuit aims to be extremely flexible, supporting any manner of synchronous or asynchronous API.

> **NOTE** short-circuit is under development, headed towards its first release.

>Todo List
* Fully document API
* Tutorial, walkthrough

## Concepts
* `resolve()` - A strategy for resolving data for the queries declared by containers. Typically this will both fetch from your API and manage cache update actions. Applications define this resolution strategy at the root of their application and it's provided via context to containers throughout the component tree.
* Queries and Args - Container components define their data requirements with respect to:
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

* `resolve : Function` - Simply a function that resolves data (in Promise form) for a container's query requirements.
* `createResolve : Function` - *Optional* - A factory function that should be used to create a `resolve` function per container. This allows for optimization/memoization of the resolve function on a per-container basis. The function should take the form `function(containerComponent)` and return a `resolve` function.

### `createRootContainer(options)`
Root containers are created from specifications of data requirements and maintain and expose state about data fetch. They respond to prop changes, maintain a lifecycle of args and data requirements, and request data to be resolved using the provided short-circuit resolve function. Root containers expose their data, args, and pending/error states via React's context.

Options can be one of the following:
* `function(props)` - Through which query requirements are computed directly from props.
* `Object` - An object
  * `args(props): Object` - A function returning props that should be treated as args to
  your queries and exposed by containers for gating prop changes along the data resolution lifecycle.
  * `queries(args): Object` - The queries function, returning the containers data requirements according to the passed args.
  * `target: Component` - *Optional* - The target component for this root container. This will be passed to `createResolve` (if used). This option would likely be used in conjunction with custom decorators.


  #### Example
  Advanced example creates a root container that resolves a 'Todo' by id. A custom component receives the state via context and manages a more complex lifecycle for pending load and failure states.
  ```
  import { createRootContainer, rootContainerShape } from 'short-circuit';

  const TodoRootContainer = createRootContainer({
      args: (props) => ({ todoId: props.id })
      query: (args) => ({
          todo: {
              resourceType: 'todo',
              resource: { id: args.todoId }
          }
      })
  });

  function Todo(props, context){
      const shortCircuit = context.shortCircuitRootContainer;
      // Root containers expose their state
      const { current, failed, pending }  = shortCircuit;

      // Implement your own logic for managing ready and error states
      if(failed){
          return <div>Failed to load Todo:{ failed.args.todoId}, {failed.error}</div>
      } else if(!current || current.stale){
          return <div>Loading Todo:{ pending.args.todoId }...</div>;
      } else {
          const { args, data }  = current;
          const { todo }  = data;
          const { todoId } = args;
          return <div>
              <span>{ todoId }: { todo.message }</span>
          </div>;
      }
  }

  function Application(props){
      return (
          <TodoRootContainer id={props.selectedTodoId} >
              <Todo />
          </TodoRootContainer>
      );
  }
  ```


### `createContainer(options) : Function`
An es7 compatible decorator that will wrap a target component and spread data props using a root container and a simple strategy for deferring rendering of the target component.

Expects the same options as `createRootContainer` with the addition of:
* 'renderLoading: boolean' - *Optional*, default `false` - Whether the decorated/target component should be rendered while data is being resolved.

#### Example
```
import { createContainer } from 'short-circuit';
@createContainer({
    args: (props) => ({ todoId: props.id })
    query: (args) => ({
        todo: {
            resourceType: 'todo',
            resource: { id: args.todoId }
        }
    }),
    renderPending: false // don't render until data is fetched.
})
function TodoContainer(props){
    return <div>
        <span>{ props.todoId }: { props.todo.message }</span>
    </div>;
}

function Application(props){
    return (
        <TodoContainer id={props.selectedTodoId} />
    );
}
```

### `createDecorator(decoratorFactory)`
Advanced feature to create an es7 compatible decorator with functional strategy for handling the short-circuit `RootContainer` lifecycle.

* `decoratorFactory: Function` - Should be a function that accepts the target component and short-circuit options as args and returns a functional stateless component deciding what to render given props and short-circuit context. Typically, this would be used once to produce the decorator used within an application. It affords the ability to define consistent behavior with regards to loading indicators, error messaging, ready state notification, etc.

#### Example
Short-Circuit's provided `createContainer` is built using `createDecorator`, and defines a strategy that defers rendering the target component until the first set of data has been loaded.

```
const createContainer = createDecorator( (TargetComponent, options) =>
    function(props, context){
        // short-circuit automatically merges the rootContainerShape to contextTypes.
        const shortCircuit = context.shortCircuitRootContainer;
        const { current }  = shortCircuit;
        if(!options.renderPending && !current){
            return <noscript></noscript>;
        }
        const { data, args } = current || {};
        return <TargetComponent {...props} {... (args || {})} {...data} />;
    }
);
```
