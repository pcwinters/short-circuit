import React, { Component } from 'react';
import sinon from 'sinon';
import Q from 'q';
import {
    renderIntoDocument,
    findRenderedComponentWithType
} from 'react-addons-test-utils';
import createContainer from '../src/createContainer';
import stubContext from 'react-stub-context';

function classWithDisplayName(fn) {
    const component = class SupportStatelessComponentForTestUtils extends Component {
        render(){
            return fn(this.props, this.context);
        }
    };
    component.displayName = fn.name;
    return component;
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

    it('should spread resolved props on target', function(done){
        shortCircuit.resolve.returns(Q.when({ myProp: 1 }));
        const TargetComponent = classWithDisplayName(function TargetComponent(props) {
            return <div className="target" {...props} />;
        });
        const ContainerComponent = stubContext(
            createContainer(()=>({ myProp: 'query' }))(TargetComponent),
            context
        );

        const tree = renderIntoDocument(<ContainerComponent foo="bar" />);
        setTimeout(()=>{
            const target = findRenderedComponentWithType(tree, TargetComponent);
            target.props.should.containSubset({
                foo: "bar",
                myProp: 1
            });
            done();
        });
    });


    it('should gate and hold back args, applying them with paired data as props', function(done){
        const deferred = Q.defer();
        shortCircuit.resolve.returns(deferred.promise);
        const TargetComponent = classWithDisplayName(function TargetComponent(props) {
            return <div className="target" {...props} />;
        });
        const ContainerComponent = stubContext(
            createContainer({
                args: (props)=>({ foo: 'arg', _foo: props.foo }),
                queries: ()=>({ myProp: 'query' }),
                renderPending: true
            })(TargetComponent),
            context
        );
        const tree = renderIntoDocument(<ContainerComponent foo="bar" />);

        findRenderedComponentWithType(tree, TargetComponent)
            .props.should.containSubset({ foo: 'bar' });
        deferred.resolve({ myProp: 1 });
        setTimeout(()=>{
            findRenderedComponentWithType(tree, TargetComponent)
                .props.should.containSubset({
                    foo: "arg",
                    myProp: 1
                });
            done();
        });
    });

});
