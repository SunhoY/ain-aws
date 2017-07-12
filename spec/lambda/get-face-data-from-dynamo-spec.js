import proxyquire from 'proxyquire';
import sinon from 'sinon';
import {expect} from 'chai';

describe('Get Face Data From DynamoDB', () => {
    let handler,
        lambdaCallback,
        scanSpy;

    const event = {
        gender: 'Male'
    };

    beforeEach(() => {
        scanSpy = sinon.spy();
        lambdaCallback = sinon.spy();

        let fakeAWS = {
            "aws-sdk": {
                "DynamoDB": {
                    "DocumentClient": function() {
                        this.scan = scanSpy;
                    }
                }
            }
        };

        ({handler} = proxyquire("../../lambda/get-face-data-from-dynamo", fakeAWS));
    });

    it('calls dynamo db', () => {
        handler(event, {}, lambdaCallback);

        expect(scanSpy.calledWith(sinon.match.object, sinon.match.func)).to.be.true;
    });

    describe('Parameter Test', () => {
        let parameter;

        beforeEach(() => {
            handler(event, {}, lambdaCallback);

            parameter = scanSpy.lastCall.args[0];
        });
        
        it('has table name as "FaceBase"', () => {
            const {TableName} = parameter;

            expect(TableName).to.equal("FaceBase");
        });
        
        it('has ExpressionAttributeValues as event.gender', () => {
            const {ExpressionAttributeValues} = parameter;

            expect(ExpressionAttributeValues).to.eql({ ":gender": "Male" });
        });

        it('has KeyConditionExpression comparing with gender', () => {
            const {FilterExpression} = parameter;

            expect(FilterExpression).to.equal("gender = :gender")
        });
    });
    
    describe('Scan Callback Test', () => {
        let scanCallback;
        
        beforeEach(() => {
            handler(event, {}, lambdaCallback);
            
            scanCallback = scanSpy.lastCall.args[1];
        });

        describe('Error', () => {
            it('calls lambda callback with error if error occurred', () => {
                scanCallback("sorry i'm error", null);

                expect(lambdaCallback.calledWith("sorry i'm error"), null).to.be.true;
            });
        });

        it('runs lambdaCallback with Items value', () => {
            scanCallback(null, {Items: "some output from dynamo db"});

            expect(lambdaCallback.calledWith(null, "some output from dynamo db")).to.be.true;
        });
    });
});
