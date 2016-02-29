import React from 'react';
import warning from 'warning';
import createRootContainer, { rootContainerShape } from './createRootContainer';

function getDisplayName(component){
    const name = component.displayName || component.name;
    warning(name, "short-circuit container wrapped a component without a proper displayName");
    return name;
}

/**
 * Create an es7 decorator capable of managing the short-circuit lifecycle.
 * @param  {Function} decoratorFactory A function that returns a decorator
 * component that decorates a target component with short-circuit state and
 * lifecycle management.
 * @return {Function} A decorator that accepts RootContainer options and
 * decorates a target component.
 */
export default function createDecorator(decoratorFactory){
    return function(options){
        return function(TargetComponent){
            const Decorator = decoratorFactory(TargetComponent, options);
            const RootContainer = createRootContainer(options);
            const RootContainerWithTarget = function(props){
                return (
                    <RootContainer {...props}>
                        <Decorator {...props} />
                    </RootContainer>
                );
            };
            RootContainerWithTarget.contextTypes = RootContainer.contextTypes;
            // Mixin context for the wrapper.
            Decorator.contextTypes = Object.assign({}, Decorator.contextTypes, {
                shortCircuitRootContainer: rootContainerShape.isRequired
            });
            Decorator.displayName = Decorator.displayName || `shortCircuitContainer(${getDisplayName(TargetComponent)})`;
            return RootContainerWithTarget;
        };
    };
}
