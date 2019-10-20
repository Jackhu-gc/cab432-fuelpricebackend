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
const S3 = new AWS.S3();

const bucketName = "cab432siteinfo";

router.get("/sites", function(req, res, next) {
  const redisKey = `key:sites`;
  //   const url =
  //     "https://fppdirectapi-prod.fuelpricesqld.com.au/Subscriber/GetFullSiteDetails?countryId=21&geoRegionLevel=3&geoRegionId=1";
  return redisClient.get(redisKey, (err, result) => {
    if (result) {
      const resultJSON = JSON.parse(result);
      //console.log(resultJSON);
      //console.log(resultJSON);
      var array = [];

      for (var property in resultJSON) {
        console.log(resultJSON[property]);
        array.push(resultJSON[property]);
      }
      return res.status(200).json(array);
    } else {
      // Check S3
      const params = {
        Bucket: "cab432sitesinfo",
        Key: "sites3month"
      };
      return new AWS.S3({ apiVersion: "2006-03-01" }).getObject(
        params,
        (err, result) => {
          if (result) {
            const resultJSON = JSON.parse(result.Body);
            // for (const x of Array(35).keys()) {
            //   var keyobj = x.toString();
            //   console.log(keyobj)
            //   resultJSON.keyobj
            //   console.log();
            // }

            redisClient.setex(
              redisKey,
              3600,
              JSON.stringify({ ...resultJSON })
            );
            return res.status(200).json(resultJSON);
          } else {
            return res
              .status(404)
              .json("Site Data Not Found :( Contact the owners..");
          }
        }
      );
    }
  });
});

module.exports = router;
