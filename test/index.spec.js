import * as shortCircuit from '../src/index';
import createContainer from '../src/createContainer';
import createDecorator from '../src/createDecorator';
import createRootContainer from '../src/createRootContainer';

import ShortCircuitProvider, { providerShape } from '../src/ShortCircuitProvider';
import { rootContainerShape } from '../src/createRootContainer';


describe('index', function(){
    it('should export createContainer', function(){
        shortCircuit.createContainer.should.eql(createContainer);
    });
    it('should export createDecorator', function(){
        shortCircuit.createDecorator.should.eql(createDecorator);
    });
    it('should export createRootContainer', function(){
        shortCircuit.createRootContainer.should.eql(createRootContainer);
    });
    it('should export ShortCircuitProvider', function(){
        shortCircuit.ShortCircuitProvider.should.eql(ShortCircuitProvider);
    });
    it('should export providerShape', function(){
        shortCircuit.providerShape.should.eql(providerShape);
    });
    it('should export rootContainerShape', function(){
        shortCircuit.rootContainerShape.should.eql(rootContainerShape);
    });
});
