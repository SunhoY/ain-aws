'use strict';

let AWS = require('aws-sdk');
let DynamoDB = new AWS.DynamoDB();

exports.handler = (event, context, callback) => {
    const {fileName, gender, faceData} = event;

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
            file_name: {
                S: fileName
            },
            face_data: AWS.DynamoDB.Converter.input(faceDataObject),
            gender: {
                S: gender
            }
        }
    };

    DynamoDB.putItem(param, function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, data);
        }
    });
};
