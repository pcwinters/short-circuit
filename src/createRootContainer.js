import invariant from 'invariant';
import { Component, PropTypes } from 'react';

import { providerShape } from './ShortCircuitProvider';

function isFunction(arg){
    return typeof arg === 'function';
}

function isPromise(arg){
    return arg
        && arg.then && isFunction(arg.then)
        && arg.catch && isFunction(arg.catch);
}

export const rootContainerShape = PropTypes.shape({
    parent: PropTypes.object,
    current: PropTypes.object,
    pending: PropTypes.object,
    failed: PropTypes.object
});

export default function createRootContainer(options){
    invariant(!!options, "Illegal argument, short-circuit root containers must define options");
    invariant(isFunction(options) || isFunction(options.queries), "Illegal argument, short-circuit root containers require options to be a queries function or an object with 'queries' property as a function");
    invariant(isFunction(options) || isFunction(options.args), "Illegal argument, short-circuit root containers require the optional 'args' option to be a function");

    const queriesFactory = isFunction(options) ? options : options.queries;
    const argsFactory = isFunction(options) ? undefined : options.args;
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
            this.state = {};
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
            let pendingPromise = (this.pendingPromise) ? this.pendingPromise : Promise.resolve();

            pendingPromise = pendingPromise.then(()=>{
                const args = argsFactory ? argsFactory(props) : undefined;
                // Set to stale if we have a current state
                const currentAfterPending = this.state.current ? Object.assign({
                    stale: true
                }, this.state.current) : this.state.current;
                this.setState({
                    pending: { args },
                    current: currentAfterPending
                });

                const queriesResult = queriesFactory(args ? args : props, this.resolve );
                const queriesPromise = isPromise(queriesResult) ? queriesResult : Promise.resolve(queriesResult);
                return queriesPromise
                    .then( queries => {
                        this.setState({
                            pending: Object.assign({}, this.state.pending, {
                                queries
                            })
                        });
                        return this.resolve(queries, args)
                            .then(data => [data, queries]);
                    })
                    .then(([data, queries]) => {
                        this.setState({
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
