let {S3} = require("aws-sdk");

exports.handler = (event, context, callback) => {
    let s3 = new S3();

    let {base64Image, fileType} = event;
    let extension = fileType.split("/")[1];
    let fileName = new Date().getTime().toString();

    let fileNameWithExtension = `${fileName}.${extension}`;
    let parameters = {
        Body: Buffer.from(base64Image, "base64"),
        Bucket: "ain-images",
        Key: fileNameWithExtension
    };

    s3.putObject(parameters, (err, data) => {
        if(err) {
            return callback(err, data);
        }

        callback(null, {storedFileName: fileNameWithExtension});
    });
};