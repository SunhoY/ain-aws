import sinon from 'sinon';
import {expect} from 'chai';
import proxyquire from 'proxyquire';
import AWS from 'aws-sdk';

describe('Store Face Data at Dynamo', () => {
    let handler,
        putSpy,
        lambdaCallback;

    const faceEvent = {
        fileName: '전지현.png',
        faceData: [{
            type: 'leftEye',
            distance: 10.5,
            inclination: -5
        }, {
            type: 'rightEye',
            distance: 8.5,
            inclination: 7
        }],
        gender: "Male"
    };

    beforeEach(() => {
        lambdaCallback = sinon.spy();
        putSpy = sinon.spy();

        let fakeAWS = {
            'aws-sdk': {
                DynamoDB: {
                    DocumentClient: function () {
                        this.put = putSpy;
                    }
                }
            }
        };

        fakeAWS["aws-sdk"].DynamoDB.Converter = AWS.DynamoDB.Converter;

        ({handler} = proxyquire('../../lambda/store-face-data-at-dynamo', fakeAWS));
    });

    describe('calls putItem api from DynamoDB', () => {
        let parameters,
            putItemCallback;

        beforeEach(() => {
            handler(faceEvent, {}, lambdaCallback);

            parameters = putSpy.lastCall.args[0];
            putItemCallback = putSpy.lastCall.args[1];
        });

        describe('Parameters test', () => {
            it('has table name "FaceBase"', () => {
                expect(parameters.hasOwnProperty('TableName')).to.be.true;
                expect(parameters.TableName).to.equal('FaceBase');
            });

            describe('Item test', () => {
                let Item;

                beforeEach(() => {
                    ({Item} = parameters);
                });

                it('includes file name', () => {
                    expect(Item.hasOwnProperty("fileName")).to.be.true;
                    expect(Item.fileName).to.equal("전지현.png");
                });

                it('includes face data', () => {
                    expect(Item.hasOwnProperty("faceData")).to.be.true;
                    expect(Item.faceData).to.eql({
                        leftEye: {
                            distance: 10.5,
                            inclination: -5
                        },
                        rightEye: {
                            distance: 8.5,
                            inclination: 7
                        }
                    })
                });

                it('includes gender', () => {
                    expect(Item.gender).to.eql("Male");
                });
            });
        });

        describe('putItem callback', () => {
            describe('on error', () => {
                it('runs callback with error', () => {
                    putItemCallback("some error", null);

                    expect(lambdaCallback.calledWith("some error"));
                });
            });

            describe('on success', () => {
                it('runs callback with data', () => {
                    putItemCallback(null, "some data");

                    expect(lambdaCallback.calledWith(null, "some data"));
                });
            });
        });
    });
});