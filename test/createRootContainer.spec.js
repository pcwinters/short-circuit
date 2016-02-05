import React from 'react';
import sinon from 'sinon';
import Q from 'q';

import { shallowRender } from 'skin-deep';

import createRootContainer from '../src/createRootContainer';

describe('createRootContainer', function(){
    let context;
    let shortCircuit;
    beforeEach(function(){
        shortCircuit = {
            resolve: sinon.stub(),
            subscribe: sinon.stub()
        };
        shortCircuit.createResolve = ()=> shortCircuit.resolve;
        context = {
            shortCircuit
        };
    });

    it('should resolve queries on mount', function(){
        const deferred = Q.defer();
        shortCircuit.resolve.returns(deferred.promise);
        const RootContainer = createRootContainer(()=>({ myProp: 'query' }));
        shallowRender(<RootContainer />, context);
        shortCircuit.resolve.should.be.calledWith({ myProp: 'query' });
    });

    it('should publish pending args and queries on context on mount', function(){
        const deferred = Q.defer();
        shortCircuit.resolve.returns(deferred.promise);
        const RootContainer = createRootContainer({
            args: ()=>({ myArg: 'arg' }),
            queries: ()=>({ myProp: 'query' })
        });
        const tree = shallowRender(<RootContainer/>, context);
        tree.getMountedInstance().state.pending.should.eql({
            args: { myArg: 'arg' },
            queries: { myProp: 'query' }
        });
    });

    it('should resolve queries with props if args option is not defined', function(){
        const queriesStub = sinon.stub().returns({ myProp: 'query' });
        const deferred = Q.defer();
        const props = { someProp: 'prop' };
        shortCircuit.resolve.returns(deferred.promise);
        const RootContainer = createRootContainer(queriesStub);
        shallowRender(<RootContainer {...props} />, context);
        queriesStub.should.be.calledWith(props);
    });

    it('should resolve data and publish current args, queries, data', function(done){
        shortCircuit.resolve.returns(Q.when({ myProp: 1 }));
        const RootContainer = createRootContainer({
            args: ()=>({ myArg: 'arg' }),
            queries: ()=>({ myProp: 'query' })
        });
        const tree = shallowRender(<RootContainer/>, context);
        setTimeout(()=>{
            tree.getMountedInstance().state.current.should.eql({
                data: { myProp: 1 },
                queries: { myProp: 'query' },
                args: { myArg: 'arg' }
            });
            done();
        });
    });
});
