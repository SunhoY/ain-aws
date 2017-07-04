let AWS = require('aws-sdk');
let DynamoDB = new AWS.DynamoDB();

function createDynamoItem(faceData) {
    let returnObject = {};
    returnObject[faceData.type] = {
        M: {
            distance: {
                S: String(faceData.distance)
            },
            inclination: {
                S: String(faceData.inclination)
            }
        }
    };
    return returnObject;
}

exports.handler = (event, context, callback) => {
    let faceData = event.faceData.reduce((previous, current) => {
        let mapItem = Object.assign({}, previous.M, createDynamoItem(current));

        return {M: mapItem};
    }, {M: {}});

    let param = {
        TableName: 'face_base',
        Item: {
            file_name: {
                S: event.fileName
            },
            face_data: faceData
        }
    };

    console.log(JSON.stringify(param));

    DynamoDB.putItem(param, function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, data);
        }
    });
};
