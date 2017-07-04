import sinon from 'sinon';
import {expect} from 'chai';
import proxyquire from 'proxyquire';

describe('Store Face Data at Dynamo', () => {
    let handler,
        putItemSpy,
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
        }]
    };

    beforeEach(() => {
        lambdaCallback = sinon.spy();
        putItemSpy = sinon.spy();
        ({handler} = proxyquire('../../lambda/store-face-data-at-dynamo', {
            'aws-sdk': {
                DynamoDB: function () {
                    this.putItem = putItemSpy;
                }
            }
        }));
    });

    describe('calls putItem api from DynamoDB', () => {
        let parameters,
            putItemCallback;

        beforeEach(() => {
            handler(faceEvent, {}, lambdaCallback);

            parameters = putItemSpy.lastCall.args[0];
            putItemCallback = putItemSpy.lastCall.args[1];
        });

        describe('Parameters test', () => {
            it('has table name "face_base"', () => {
                expect(parameters.hasOwnProperty('TableName')).to.be.true;
                expect(parameters.TableName).to.equal('face_base');
            });

            describe('Item test', () => {
                let Item;

                beforeEach(() => {
                    ({Item} = parameters);
                });

                it('includes file name', () => {
                    expect(Item.hasOwnProperty("file_name")).to.be.true;
                    expect(Item.file_name).to.eql({
                        S: "전지현.png"
                    });
                });

                it('includes face data', () => {
                    expect(Item.hasOwnProperty("face_data")).to.be.true;
                    expect(Item.face_data).to.eql({
                        M: {
                            leftEye: {
                                M: {
                                    distance: {
                                        S: "10.5"
                                    },
                                    inclination: {
                                        S: "-5"
                                    }
                                }
                            },
                            rightEye: {
                                M: {
                                    distance: {
                                        S: "8.5"
                                    },
                                    inclination: {
                                        S: "7"
                                    }
                                }
                            }
                        }
                    })
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