import { Component, PropTypes } from 'react';

export const providerShape = PropTypes.shape({
    subscribe: PropTypes.func.isRequired,
    createResolve: PropTypes.func.isRequired
});

function isFunction(fn){
    return typeof fn === 'function';
}

function resolveValidator(props, propName, componentName){
    if(isFunction(props.resolve) || isFunction(props.createResolve)){
        return;
    }
    throw new Error(`${componentName} requires one of props 'resolve' or 'createResolve' to be a function`);
}

export default class ShortCircuitProvider extends Component {

    static get displayName() {
        return 'ShortCircuitProvider';
    }

    static get propTypes() {
        return {
            subscribe: PropTypes.func.isRequired,
            resolve: resolveValidator,
            /**
             * A factory for creating a resolve function that accepts a component
             * as argument. This advanced feature allows for creating resolve
             * functions memoized to a particular RootContainer using a selector
             * library like 'reselect'.
             * @example
             * props.createResolve = function(container){
             *   return reselect.createSelector(
             *   	(queries) => queries,
             *   	() => container,
             *   	(queries, container) => resolve(queries)
             *   )
             * }
             */
            createResolve: resolveValidator
        };
    }

    static get childContextTypes() {
        return {
            shortCircuit: providerShape
        };
    }

    constructor(props, context){
        super(props, context);
        const { resolve, createResolve } = this.props;
        this.createResolve = createResolve || (()=> resolve);
    }

    componentWillUpdate(nextProps){
        if( nextProps.resolve != this.props.resolve ||
            nextProps.createResolve != this.props.resolve ){
            const { resolve, createResolve } = nextProps;
            this.createResolve = createResolve || (()=> resolve);
        }
    }

    getChildContext(){
        const { subscribe } = this.props;
        return {
            shortCircuit: {
                subscribe,
                createResolve: this.createResolve
            }
        };
    }

    render(){
        return this.props.children;
    }
}
