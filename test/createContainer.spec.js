import React from 'react';
import sinon from 'sinon';
import Q from 'q';
import createContainer from '../src/createContainer';

function withDisplayName(fn) {
    fn.displayName = fn.name;
    return fn;
}

describe('createContainer', function(){
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

    // it('should spread resolved props on target', function(done){
    //     shortCircuit.resolve.returns(Q.when({ myProp: 1 }));
    //     const TargetComponent = withDisplayName(function TargetComponent(props) {
    //         return <div className="target" {...props} />;
    //     });
    //     const ContainerComponent = createContainer(()=>({ myProp: 'query' }))(TargetComponent);
    //     const container = mount(<ContainerComponent foo="bar" />, { context });
    //     setTimeout(()=>{
    //         container.find('.target').props().should.containSubset({
    //             foo: "bar",
    //             myProp: 1
    //         });
    //         done();
    //     });
    // });
    //
    // it('should gate and hold back args, applying them with paired data as props', function(done){
    //     const deferred = Q.defer();
    //     shortCircuit.resolve.returns(deferred.promise);
    //     const TargetComponent = withDisplayName(function TargetComponent(props) {
    //         return <div className="target" {...props} />;
    //     });
    //     const ContainerComponent = createContainer({
    //         args: (props)=>({ foo: 'arg', _foo: props.foo }),
    //         queries: ()=>({ myProp: 'query' })
    //     })(TargetComponent);
    //     const container = mount(<ContainerComponent foo="bar" />, { context });
    //     const target = container.find('.target');
    //
    //     target.props().should.containSubset({ foo: 'bar' });
    //     deferred.resolve({ myProp: 1 });
    //     setTimeout(()=>{
    //         container.find('.target').props().should.containSubset({
    //             foo: "arg",
    //             myProp: 1
    //         });
    //         done();
    //     });
    // });

});
