import invariant from 'invariant';
import { Component, PropTypes } from 'react';

import { providerShape } from './ShortCircuitProvider';
import * as ReadyState from './ReadyState';

function isFunction(arg){
    return typeof arg === 'function';
}

function isPromise(arg){
    return arg
        && arg.then && isFunction(arg.then)
        && arg.catch && isFunction(arg.catch);
}

export const rootContainerShape = PropTypes.shape({
    readyState: PropTypes.string, // TODO oneOf
    parent: PropTypes.object,
    current: PropTypes.object,
    pending: PropTypes.object,
    failed: PropTypes.object
});

/**
 * Creates a pseudo-promise that will resolve immediately instead of going
 * asynchronous. This helps to support async resolve().
 * @param  value The value to resolve.
 * @return {Promise} A faux promise. Implements then()
 */
function resolveImmediately(value){
    return {
        then: (callback)=>callback(value)
    };
}

export default function createRootContainer(options){
    invariant(!!options, "Illegal argument, short-circuit root containers must define options");
    invariant(isFunction(options) || isFunction(options.queries), "Illegal argument, short-circuit root containers require options to be a queries function or an object with 'queries' property as a function");
    invariant(isFunction(options) || isFunction(options.args), "Illegal argument, short-circuit root containers require the optional 'args' option to be a function");

    const queriesFactory = isFunction(options) ? options : options.queries;
    const argsFactory = isFunction(options) ? undefined : options.args;
    // FIXME doc this. Used for createResolve!!
    const target = isFunction(options) ? undefined : options.target;

    class RootContainer extends Component {

        getChildContext(){
            return {
                shortCircuitRootContainer: Object.assign({
                    parentContainer: this.context.shortCircuitRootContainer
                }, this.state)
            };
        }

        constructor(props, context){
            super(props, context);
            this.state = {
                readyState: ReadyState.INITIAL_LOADING
            };
            this.resolve = this.context.shortCircuit.createResolve(target || this);
        }

        componentWillMount(){
            this.unsubscribe = this.context.shortCircuit.subscribe(this.resolveQueries.bind(this));
            this.resolveQueries();
        }

        componentWillUpdate(nextProps, nextState, nextContext){
            if (nextContext.shortCircuit.createResolve != this.context.shortCircuit.createResolve){
                this.resolve = context.shortCircuit.createResolve(target || this);
            }
            if (this.props === nextProps) { return; }
            this.resolveQueries(nextProps);
        }

        componentWillUnmount(){
            this.unsubscribe();
        }

        render(){
            return this.props.children;
        }

        resolveQueries(props = this.props){
            let pendingPromise = (this.pendingPromise) ? this.pendingPromise : resolveImmediately();

            pendingPromise = pendingPromise.then(()=>{
                const args = argsFactory ? argsFactory(props) : undefined;

                this.setState({
                    readyState: ReadyState.hasLoaded(this.state.readyState) ? ReadyState.LOADING : ReadyState.INITIAL_LOADING,
                    pending: { args }
                });

                const queriesResult = queriesFactory(args ? args : props, this.resolve );
                const queriesPromise = isPromise(queriesResult) ? queriesResult : resolveImmediately(queriesResult);
                return queriesPromise
                    .then( queries => {
                        this.setState({
                            pending: Object.assign({}, this.state.pending, {
                                args,
                                queries
                            })
                        });
                        return this.resolve(queries, args)
                            .then(data => [data, queries]);
                    })
                    .then(([data, queries]) => {
                        this.setState({
                            readyState: ReadyState.LOADED,
                            current: {
                                args,
                                queries,
                                data
                            },
                            pending: null,
                            failed: null
                        });
                    })
                    .catch(error => {
                        this.setState({
                            readyState: ReadyState.hasLoaded(this.state.readyState) ? ReadyState.ERROR : ReadyState.INITIAL_ERROR,
                            pending: null,
                            failed: {
                                args,
                                error
                            }
                        });
                        return Promise.reject(error);
                    });
            })
            .then(
                cleanupPromise,
                (error) => {
                    cleanupPromise();
                    Promise.reject(error);
                }
            );
            const cleanupPromise = () => {
                if(this.pendingPromise === pendingPromise){
                    this.pendingPromise = null;
                }
            };
            this.pendingPromise = pendingPromise;
        }
    }
    RootContainer.displayName = 'shortCircuitRootContainer';
    RootContainer.contextTypes = {
        shortCircuit: providerShape.isRequired,
        shortCircuitRootContainer: rootContainerShape // for possible parent
    };
    RootContainer.childContextTypes = {
        shortCircuitRootContainer: rootContainerShape.isRequired
    };
    return RootContainer;
}
