import React from 'react';
import warning from 'warning';
import invariant from 'invariant';

import createRootContainer, { rootContainerShape } from './createRootContainer';

function getDisplayName(component){
    const name = component.displayName;
    warning(name, "short-circuit container wrapped a component without a proper displayName");
    return name || component.name;
}

export default function container(options){
    invariant(options, "Illegal argument, short-circuit containers require options");
    const renderPending = true; //options.renderPending || false;
    const RootContainer = createRootContainer(options);
    return function(TargetComponent){
        const DecoratedTarget = function(props, context){
            const shortCircuit = context.shortCircuitRootContainer;
            const { current }  = shortCircuit;
            if(!renderPending && !current.data){
                return null;
            }
            const { data, args } = current;
            return <TargetComponent {...props} {... (args || {})} {...data} />;
        };
        DecoratedTarget.contextTypes = {
            shortCircuitRootContainer: rootContainerShape.isRequired
        };
        DecoratedTarget.displayName = `shortCircuitContainer(${getDisplayName(TargetComponent)})`;

        const RootContainerWithTarget = function(props){
            return (
                <RootContainer>
                    <DecoratedTarget {...props} />
                </RootContainer>
            );
        };
        RootContainerWithTarget.contextTypes = RootContainer.contextTypes;
        return RootContainerWithTarget;
    };
}
