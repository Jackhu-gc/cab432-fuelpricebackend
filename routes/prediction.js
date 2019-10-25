var express = require('express');
var router = express.Router();
const AWS = require('aws-sdk')
const redis = require("redis");
const redisClient = redis.createClient();
redisClient.on("error", err => {
    console.log("Error " + err);
});

//set credentials to be default for forecast arn
const credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
AWS.config.credentials = credentials;
AWS.config.update({region: 'ap-southeast-1'});

const bucketName = 'cab432siteinfo';


/* GET users listing. */
router.get('/', function (req, res, next) {

    const forecastqueryservice = new AWS.ForecastQueryService();
    const redisKey = req.query.siteid + req.query.startdate + req.query.enddate;
    const s3Key = req.query.siteid + req.query.startdate + req.query.enddate;
    const s3StorageParams = {Bucket: bucketName, Key: s3Key};

    const params = {
        Filters: {
            "item_id": req.query.siteid,
        },
        ForecastArn: 'arn:aws:forecast:ap-southeast-1:868927639406:forecast/threemonthPred',
        EndDate: req.query.enddate + 'T00:00:00',
        StartDate: req.query.startdate + 'T00:00:00',
    };

    return redisClient.get(redisKey, (err, result) => {
        if (result) {
            const resultJSON = JSON.parse(result);
            return res.status(200).json({"results":resultJSON});
        } else {
            return new AWS.S3({apiVersion: '2006-03-01'}).getObject(s3StorageParams, (err, s3result) => {
                if (s3result) {
                    const resultJSON = JSON.parse(s3result.Body);
                    redisClient.setex(redisKey, 3600, JSON.stringify(resultJSON));
                    return res.status(200).json({"results":resultJSON});
                } else {
                    return forecastqueryservice.queryForecast(params, (err, data) => {
                            if (err) res.status(400).json(err);
                            else {
                                let APIresults = data.Forecast.Predictions.p50.map(info => {
                                    return ({
                                        siteid: params.Filters.item_id,
                                        lat: req.query.lat,
                                        lng: req.query.lng,
                                        address: req.query.address,
                                        date: info.Timestamp.substring(0, 10),
                                        price: info.Value
                                    })
                                });
                                const s3body = JSON.stringify(APIresults);
                                const s3ObjectParams = {Bucket: bucketName, Key: s3Key, Body: s3body};
                                const uploadPromise = new AWS.S3({apiVersion: "2006-03-01"})
                                    .putObject(s3ObjectParams).promise();
                                uploadPromise.then(() => {
                                    console.log("Successful upload data to " + bucketName + "/" + s3Key);
                                });
                                redisClient.setex(redisKey, 3600, JSON.stringify(APIresults),
                                );

                                res.status(200).json({
                                    'results': APIresults,
                                });
                            }
                        }
                    )
                }

            })
        }
    })
});

module.exports = router;
