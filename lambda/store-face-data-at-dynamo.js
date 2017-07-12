'use strict';

let AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
    const {fileName, gender, faceData} = event;
    const client = new AWS.DynamoDB.DocumentClient();

    let faceDataObject = faceData.reduce((previous, current) => {
        let parseCurrent = {};
        const {distance, inclination} = current;

        parseCurrent[current.type] = {
            distance: distance,
            inclination: inclination
        };

        return Object.assign({}, previous, parseCurrent);
    }, {});

    let param = {
        TableName: 'face_base',
        Item: {
            file_name: fileName,
            face_data: faceDataObject,
            gender: gender
        }
    };

    client.put(param, function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, data);
        }
    });
};
