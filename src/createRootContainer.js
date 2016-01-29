import invariant from 'invariant';
import { Component, PropTypes } from 'react';

import { providerShape } from './ShortCircuitProvider';

function isFunction(arg){
    return typeof arg === 'function';
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

    class RootContainer extends Component {

        static get displayName(){
            return 'shortCircuitRootContainer';
        }

        static get contextTypes(){
            return {
                shortCircuit: providerShape.isRequired,
                shortCircuitRootContainer: rootContainerShape // for possible parent
            };
        }

        static get childContextTypes(){
            return {
                shortCircuitRootContainer: rootContainerShape.isRequired
            };
        }

        getChildContext(){
            return {
                shortCircuitRootContainer: Object.assign({
                    parentContainer: this.context.shortCircuitRootContainer
                }, this.state)
            };
        }

        constructor(){
            super();
            this.state = {};
        }

        componentWillMount(){
            this.unsubscribe = this.context.shortCircuit.subscribe(this.resolveQueries.bind(this));
            this.resolveQueries();
        }

        componentWillUpdate(nextProps){
            if (this.props === nextProps) { return; }
            this.resolveQueries(nextProps);
        }

        componentWillUnmount(){
            this.unsubscribe();
            const pendingPromise = this.pendingPromise || {};
            pendingPromise.cancel = true;
        }

        render(){
            return this.props.children;
        }

        resolveQueries(props = this.props){
            const args = argsFactory ? argsFactory(props) : undefined;
            const queries = queriesFactory(args ? args : props );

            const shortCircuit = this.context.shortCircuit;
            // Cancel an existing/pending promise
            if (this.pendingPromise) {
                this.pendingPromise.cancel = true;
            }
            this.setState({
                pending: { args, queries },
                current: Object.assign({
                    stale: true
                }, this.state.current)
            });
            const pendingPromise = shortCircuit.resolve(queries, shortCircuit);
            this.pendingPromise = pendingPromise;
            pendingPromise
                .then(data => {
                    if (pendingPromise.cancel) return;
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
                    if (pendingPromise.cancel) return;
                    this.setState({
                        pending: {},
                        failed: {
                            args,
                            queries,
                            error
                        }
                    });
                });
        }
    }
    return RootContainer;
}
