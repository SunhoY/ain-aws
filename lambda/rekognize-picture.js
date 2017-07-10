'use strict';
let {Rekognition} = require('aws-sdk');

/**
 * @param event JSON {fileName: {string} }
 * @param context
 * @param callback
 */

exports.handler = (event, context, callback) => {
    let {fileName} = event;

    let params = {
        Attributes: ['ALL'],
        Image: {
            S3Object: {
                Bucket: "ain-images",
                Name: fileName
            }
        }
    };

    let rekognition = new Rekognition();
    rekognition.detectFaces(params, getFaceDetectionCallback(callback, fileName));
};

function getFaceDetectionCallback(callback, fileName) {
    return (err, data) => {
        if (err) {
            console.log(err);
            return callback(err, data);
        }

        const firstFaceDetail = data.FaceDetails[0];
        const landmarks = firstFaceDetail.Landmarks;
        const nose = landmarks.find((data) => data.Type === "nose");
        const gender = firstFaceDetail.Gender.Value;
        const faceData = landmarks.reduce((previous, current) => {
            if (current.Type === "nose") {
                return previous;
            }

            console.log(`type: ${current.Type} | ${JSON.stringify(current)}`);

            let distance = calculateDistance(nose, current);
            let inclination = calculateInclination(nose, current);
            let faceVector = {
                type: current.Type,
                distance,
                inclination
            };

            console.log(`face vector: ${JSON.stringify(faceVector)}`);

            return [...previous, faceVector];
        }, []);

        callback(null, {
            fileName,
            faceData,
            gender
        });
    };
}

function calculateDistance(from, to) {
    let fromX = Number(from.X);
    let fromY = Number(from.Y);
    let toX = Number(to.X);
    let toY = Number(to.Y);

    return Math.sqrt(Math.pow(fromX - toX, 2) + Math.pow(fromY - toY, 2));
}

function calculateInclination(from, to) {
    let fromX = Number(from.X);
    let fromY = Number(from.Y);
    let toX = Number(to.X);
    let toY = Number(to.Y);

    return (fromY - toY) / (fromX - toX);
}