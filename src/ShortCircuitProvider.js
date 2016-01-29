import { Component, PropTypes } from 'react';

export const providerShape = PropTypes.shape({
    subscribe: PropTypes.func.isRequired,
    resolve: PropTypes.func.isRequired
});

export default class ShortCircuitProvider extends Component {

    static get propTypes() {
        return {
            subscribe: PropTypes.func.isRequired,
            resolve: PropTypes.func.isRequired
        };
    }

    static get childContextTypes() {
        return {
            shortCircuit: providerShape
        };
    }

    getChildContext(){
        const { subscribe, resolve } = this.props;
        return {
            subscribe,
            resolve
        };
    }

    render(){
        return this.props.children;
    }
}
