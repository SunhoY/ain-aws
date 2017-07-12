'use strict';

let AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
    const client = new AWS.DynamoDB.DocumentClient();

    const parameters = {
        TableName: "face_base",
        ExpressionAttributeValues: { ":gender": event.gender },
        FilterExpression: "gender = :gender"
    };

    client.scan(parameters, (err, data) => {
        if(err) {
            return callback(err, null);
        } else {
            return callback(null, data.Items);
        }
    });
};