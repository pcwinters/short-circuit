import React from 'react';
import warning from 'warning';

import createRootContainer, { rootContainerShape } from './createRootContainer';

function getDisplayName(component){
    const name = component.displayName;
    warning(name, "short-circuit container wrapped a component without a proper displayName");
    return name || component.name;
}

export default function container(options){
    const RootContainer = createRootContainer(options);
    return function(TargetComponent){
        const DecoratedTarget = function(props, context){
            const shortCircuit = context.shortCircuitRootContainer;
            const { data, args } = shortCircuit;
            return <TargetComponent {...props} {...data} {...args} />;
        };
        DecoratedTarget.contextTypes = {
            shortCircuitRootContainer: rootContainerShape.isRequired
        };
        DecoratedTarget.displayName = `shortCircuitContainer(${getDisplayName(TargetComponent)})`;

        return function(props){
            return (
                <RootContainer>
                    <DecoratedTarget {...props} />
                </RootContainer>
            );
        };
    };
}
