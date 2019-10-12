var express = require("express");
var router = express.Router();
const responseTime = require("response-time");
const Axios = require("axios");
const redis = require("redis");
const app = express();

app.use(responseTime());
const AWS = require("aws-sdk");
const redisClient = redis.createClient();
redisClient.on("error", err => {
  console.log("Error " + err);
});
const bucketName = "callumrs3-fueldata";
// Create a promise on S3 service object
const bucketPromise = new AWS.S3({ apiVersion: "2006-03-01" })
  .createBucket({ Bucket: bucketName })
  .promise();
bucketPromise
  .then(function(data) {
    console.log("Successfully created " + bucketName);
  })
  .catch(function(err) {
    console.error(err, err.stack);
  });
const headers = {
  Authorization: "FPDAPI SubscriberToken=ea92a388-5358-44e1-a765-6aa9c4cb2cd0",
  "Content-Type": "application / json"
};
router.get("/fueltypes", function(req, res, next) {
  const redisKey = `key:fueltypes`;
  const url =
    "https://fppdirectapi-prod.fuelpricesqld.com.au/Subscriber/GetCountryFuelTypes?countryId=21";
  return redisClient.get(redisKey, (err, result) => {
    if (result) {
      const resultJSON = JSON.parse(result);
      //console.log(resultJSON);
      console.log("dfsdfs");
      resultJSON.source = "Redis Cache";
      return res.status(200).json(resultJSON);
    } else {
      const s3Key = `key-fueltypes`;
      // Check S3
      const params = { Bucket: bucketName, Key: s3Key };

      return new AWS.S3({ apiVersion: "2006-03-01" }).getObject(
        params,
        (err, result) => {
          if (result) {
            const resultJSON = JSON.parse(result.Body);
            console.log("dfds");
            redisClient.setex(
              redisKey,
              3600,
              JSON.stringify({ source: "Redis Cache", ...resultJSON })
            );
            return res.status(200).json(resultJSON);
          } else {
            Axios.get(url, { headers }).then(response => {
              let data = { Fuels: response.data.Fuels };
              const body = JSON.stringify({
                source: "S3 Bucket",
                ...data
              });
              const objectParams = {
                Bucket: bucketName,
                Key: s3Key,
                Body: body
              };
              const uploadPromise = new AWS.S3({ apiVersion: "2006-03-01" })
                .putObject(objectParams)
                .promise();
              uploadPromise.then(function(data) {
                console.log(
                  "Successfully uploaded data to " + bucketName + "/" + s3Key
                );
              });
              redisClient.setex(
                redisKey,
                3600,
                JSON.stringify({ source: "Redis Cache", ...data })
              );
              res.status(200).json({
                Fuels: response.data.Fuels
              });
            });
          }
        }
      );
    }
  });
});

router.get("/sites", function(req, res, next) {
  const redisKey = `key:sites`;
  const url =
    "https://fppdirectapi-prod.fuelpricesqld.com.au/Subscriber/GetFullSiteDetails?countryId=21&geoRegionLevel=3&geoRegionId=1";
  return redisClient.get(redisKey, (err, result) => {
    if (result) {
      const resultJSON = JSON.parse(result);
      //console.log(resultJSON);
      resultJSON.source = "Redis Cache";

      return res.status(200).json(resultJSON);
    } else {
      const s3Key = `key-sites`;
      // Check S3
      const params = { Bucket: bucketName, Key: s3Key };
      return new AWS.S3({ apiVersion: "2006-03-01" }).getObject(
        params,
        (err, result) => {
          if (result) {
            const resultJSON = JSON.parse(result.Body);
            console.log("dfds");
            redisClient.setex(
              redisKey,
              3600,
              JSON.stringify({ source: "Redis Cache", ...resultJSON })
            );
            return res.status(200).json(resultJSON);
          } else {
            Axios.get(url, { headers }).then(response => {
              let data = { S: response.data.S };
              const body = JSON.stringify({
                source: "S3 Bucket",
                ...data
              });
              const objectParams = {
                Bucket: bucketName,
                Key: s3Key,
                Body: body
              };
              const uploadPromise = new AWS.S3({ apiVersion: "2006-03-01" })
                .putObject(objectParams)
                .promise();
              uploadPromise.then(function(data) {
                console.log(
                  "Successfully uploaded data to " + bucketName + "/" + s3Key
                );
              });
              redisClient.setex(
                redisKey,
                3600,
                JSON.stringify({ source: "Redis Cache", ...data })
              );
              res.status(200).json({
                source: "Fuel Api",
                S: response.data.S
              });
            });
          }
        }
      );
    }
  });
});

module.exports = router;
