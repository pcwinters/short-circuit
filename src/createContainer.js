import React from 'react';
import createDecorator from './createDecorator';

const createContainer = createDecorator((TargetComponent, options)=>
    function(props, context){
        const shortCircuit = context.shortCircuitRootContainer;
        const { current }  = shortCircuit;
        if(!options.renderPending && !current){
            return <noscript></noscript>;
        }
        const { data, args } = current || {};
        return <TargetComponent {...props} {... (args || {})} {...data} />;
    }
);

export default createContainer;
