import 'babel-polyfill';

import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import Q from 'q';

chai.should();
chai.use(sinonChai);

import createRootContainer from '../src/createRootContainer';

describe('createRootContainer', function(){
    let context;
    let shortCircuit;
    beforeEach(function(){
        shortCircuit = {
            resolve: sinon.stub(),
            subscribe: sinon.stub()
        };
        context = {
            shortCircuit
        };
    });

    it('should resolve queries on mount', function(){
        const deferred = Q.defer();
        shortCircuit.resolve.returns(deferred.promise);
        const RootContainer = createRootContainer(()=>({ myProp: 'query' }));
        shallow(<RootContainer />, { context });
        shortCircuit.resolve.should.be.calledWith({ myProp: 'query' });
    });

    it('should publish pending args and queries on context on mount', function(){
        const deferred = Q.defer();
        shortCircuit.resolve.returns(deferred.promise);
        const RootContainer = createRootContainer({
            args: ()=>({ myArg: 'arg' }),
            queries: ()=>({ myProp: 'query' })
        });
        const container = shallow(<RootContainer/>, { context });
        container.state().pending.should.eql({
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
        shallow(<RootContainer {...props} />, { context });
        queriesStub.should.be.calledWith(props);
    });

    it('should resolve data and publish current args, queries, data', function(done){
        shortCircuit.resolve.returns(Q.when({ myProp: 1 }));
        const RootContainer = createRootContainer({
            args: ()=>({ myArg: 'arg' }),
            queries: ()=>({ myProp: 'query' })
        });
        const container = shallow(<RootContainer/>, { context });
        setTimeout(()=>{
            container.state().current.should.eql({
                data: { myProp: 1 },
                queries: { myProp: 'query' },
                args: { myArg: 'arg' }
            });
            done();
        });
    });
});
