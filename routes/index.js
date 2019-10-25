var express = require("express");
var router = express.Router();
const redis = require("redis");

const AWS = require("aws-sdk");
const redisClient = redis.createClient();
redisClient.on("error", err => {
    console.log("Error " + err);
});

router.get("/sites", function (req, res, next) {
    const redisKey = `key:sites`;
    return redisClient.get(redisKey, (err, result) => {
        if (result) {
            const resultJSON = JSON.parse(result);
            return res.status(200).json(resultJSON);
        } else {
            // Check S3
            const params = {
                Bucket: "cab432siteinfo",
                Key: "site3month"
            };
            return new AWS.S3({apiVersion: "2006-03-01"}).getObject(
                params,
                (err, result) => {
                    if (result) {
                        const resultJSON = JSON.parse(result.Body);
                        redisClient.setex(
                            redisKey,
                            3600,
                            JSON.stringify(resultJSON),
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
