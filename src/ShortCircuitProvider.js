import { Component, PropTypes } from 'react';

export const providerShape = {
    getState: PropTypes.func.isRequired,
    subscribe: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    resolve: PropTypes.func.isRequired
};

export default class ShortCircuitProvider extends Component {

    static get propTypes() {
        return {
            getState: PropTypes.func.isRequired,
            subscribe: PropTypes.func.isRequired,
            dispatch: PropTypes.func.isRequired,
            resolve: PropTypes.func.isRequired
        };
    }

    static get childContextTypes() {
        return {
            shortCircuit: providerShape
        };
    }

    getChildContext(){
        const { getState, subscribe, dispatch, resolve } = this.props;
        return {
            getState,
            subscribe,
            dispatch,
            resolve
        };
    }

    render(){
        return this.props.children;
    }
}
