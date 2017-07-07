import sinon from 'sinon';
import {expect} from 'chai';
import proxyquire from 'proxyquire';
import btoa from 'btoa';

describe('Upload Image to S3 Spec', () => {
    let handler,
        putObjectSpy,
        lambdaCallback,
        bufferFromSpy;

    const fakeImageString = "some image";
    const eventSource  = {
        base64Image: btoa(fakeImageString),
        fileType: "image/jpeg"
    };

    beforeEach(() => {
        putObjectSpy = sinon.spy();
        lambdaCallback = sinon.spy();

        bufferFromSpy = sinon.spy(Buffer, "from");

        ({handler} = proxyquire('../../lambda/upload-image-to-S3', {
            "aws-sdk": {
                S3: function() {
                    this.putObject = putObjectSpy;
                }
            }
        }));
    });

    afterEach(() => {
        Buffer.from.restore();
    });

    describe('Parameter test', () => {
        let parameter;

        beforeEach(() => {
            let clock = sinon.useFakeTimers(new Date(1497798000000));

            handler(eventSource, {}, lambdaCallback);

            parameter = putObjectSpy.lastCall.args[0];

            clock.restore();
        });

        it('should have body as base64 decoded value', () => {
            expect(parameter.Body).to.eql(Buffer.from("some image"));
        });

        it('should have bucket as "ain-images"', () => {
            expect(parameter.Bucket).to.equal("ain-images");
        });

        it('should have Key as file name timestamp + extension', () => {
            expect(parameter.Key).to.equal("1497798000000.jpeg");
        });
    });

    describe('callback test', () => {
        let s3Callback;

        beforeEach(() => {
            let clock = sinon.useFakeTimers(new Date(1497798000000));

            handler(eventSource, {}, lambdaCallback);

            s3Callback = putObjectSpy.lastCall.args[1];

            clock.restore();
        });

        it('runs lambda callback with error when error occurred', () => {
            s3Callback("some error", null);

            expect(lambdaCallback.calledWith("some error", null)).to.be.true;
        });

        it('runs lambda callback with file name with extension', () => {
            s3Callback(null, {
                eTag: "some tag does not matter"
            });

            expect(lambdaCallback.calledWith(null, "1497798000000.jpeg")).to.be.true;
        });
    });
});
