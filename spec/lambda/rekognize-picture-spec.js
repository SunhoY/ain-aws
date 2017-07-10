import sinon from 'sinon';
import {expect} from 'chai';
import proxyquire from 'proxyquire';

describe('Rekognize Picture Spec', () => {
    let detectFacesSpy,
        handler,
        apiCallback;

    const event = {
        fileName: "pretty_face.jpg"
    };

    beforeEach(() => {
        detectFacesSpy = sinon.spy();
        apiCallback = sinon.spy();

        ({handler} = proxyquire('../../lambda/rekognize-picture', {
            'aws-sdk': {
                Rekognition: function () {
                    this.detectFaces = detectFacesSpy;
                }
            }
        }));
    });

    it('calls detectFaces api from rekognition instance', () => {
        handler(event, {}, apiCallback);

        expect(detectFacesSpy.called).to.be.true;
    });

    describe('detectFaces api parameter', () => {
        let parameters;

        beforeEach(() => {
            handler(event, {}, apiCallback);

            parameters = detectFacesSpy.lastCall.args[0];
        });

        it('has Attributes ["ALL"]', () => {
            expect(parameters.Attributes).to.eql(['ALL']);
        });

        it('has Image with S3Object', () => {
            expect(parameters.Image).to.eql({
                S3Object: {
                    Bucket: 'ain-images',
                    Name: 'pretty_face.jpg'
                }
            });
        });
    });

    describe('faceDetection callback', () => {
        let faceDetectionCallback;

        beforeEach(() => {
            handler(event, {}, apiCallback);
            faceDetectionCallback = detectFacesSpy.lastCall.args[1];
        });

        describe('on error', () => {
            it('runs callback', () => {
                faceDetectionCallback("some error", null);

                expect(apiCallback.calledWith("some error", null)).to.be.true;
            });
        });

        describe('on success', () => {
            const data = {
                FaceDetails: [
                    {
                        Landmarks: [
                            {
                                Type: 'nose',
                                X: "4",
                                Y: "5"
                            },
                            {
                                Type: 'left eye',
                                X: "7",
                                Y: "9"
                            },
                            {
                                Type: 'right eye',
                                X: "11",
                                Y: "15"
                            }
                        ],
                        Gender: {
                            Value: "MALE",
                            Confidence: 0.9
                        }
                    }
                ]
            };

            let callbackArg;

            beforeEach(() => {
                faceDetectionCallback(null, data);
                callbackArg = apiCallback.lastCall.args[1];
            });

            it('runs callback with null as error', () => {
                expect(apiCallback.calledWith(null, sinon.match.object)).to.be.true;
            });

            it('runs callback with fileName', () => {
                expect(callbackArg.hasOwnProperty('fileName')).to.be.true;
                expect(callbackArg.fileName).to.equal('pretty_face.jpg');
            });

            it('runs callback with gender', () => {
                expect(callbackArg.gender).to.equal("MALE");
            });

            describe('Face Data inspection', () => {
                let faceData;

                beforeEach(() => {
                    faceData = callbackArg.faceData;
                });

                it('has number of face data except nose', () => {
                    expect(faceData.length).to.equal(2);
                });

                it('has type, distance from nose and inclination', () => {
                    expect(faceData).to.deep.include({
                        type: 'left eye',
                        distance: 5,
                        inclination: 4/3
                    });

                    expect(faceData).to.deep.include({
                        type: 'right eye',
                        distance: Math.sqrt(149),
                        inclination: 10/7
                    });
                });
            });
        });
    });
});