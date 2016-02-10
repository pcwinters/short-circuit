import React from 'react';
import warning from 'warning';
import invariant from 'invariant';

import createRootContainer, { rootContainerShape } from './createRootContainer';

function getDisplayName(component){
    const name = component.displayName || component.name;
    warning(name, "short-circuit container wrapped a component without a proper displayName");
    return name;
}

export function createWrapper(options){
    invariant(options, "Illegal argument, short-circuit containers require options");
    return function(TargetComponent){
        options.target = options.target || TargetComponent;
        const RootContainer = createRootContainer(options);
        const RootContainerWithTarget = function(props){
            return (
                <RootContainer {...props}>
                    <TargetComponent {...props} />
                </RootContainer>
            );
        };
        // Mixin context for the wrapper.
        TargetComponent.contextTypes = Object.assign({}, TargetComponent.contextTypes, {
            shortCircuitRootContainer: rootContainerShape.isRequired
        });
        RootContainerWithTarget.contextTypes = RootContainer.contextTypes;
        return RootContainerWithTarget;
    };
}

export default function createContainer(options){
    const wrapper = createWrapper(options);
    const renderPending = options.renderPending ? options.renderPending : false;
    return function(TargetComponent){
        function DecoratedTarget(props, context){
            const shortCircuit = context.shortCircuitRootContainer;
            const { current }  = shortCircuit;
            if(!renderPending && !current){
                return <noscript></noscript>;
            }
            const { data, args } = current || {};
            return <TargetComponent {...props} {... (args || {})} {...data} />;
        }
        DecoratedTarget.contextTypes = {
            shortCircuitRootContainer: rootContainerShape.isRequired
        };
        DecoratedTarget.displayName = `shortCircuitContainer(${getDisplayName(TargetComponent)})`;
        return wrapper(DecoratedTarget);
    };
}
