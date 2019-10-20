var express = require('express');
var router = express.Router();
const AWS = require('aws-sdk')
const Axios = require("axios");
const redis = require("redis");

//set credentials to be default for forecast arn
const credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
AWS.config.credentials = credentials;
AWS.config.update({region: 'ap-southeast-1'});

/* GET users listing. */
router.get('/', function(req, res, next) {

  const forecastqueryservice = new AWS.ForecastQueryService();

  const params = {
    Filters: {
      "item_id" : req.query.siteid,
    },
    ForecastArn: 'arn:aws:forecast:ap-southeast-1:868927639406:forecast/threemonthPred',
    EndDate: req.query.enddate + 'T00:00:00',
    StartDate: req.query.startdate + 'T00:00:00',
  };

  forecastqueryservice.queryForecast(params, function(err, data) {
    if(err) console.log(err, err.stack);
    else {
      res.status(200).json({
        siteid: params.Filters.item_id,
        date: data.Forecast.Predictions.p50[0].Timestamp.substring(0, 10),
        price: data.Forecast.Predictions.p50[0].Value
      })
    }
  })
});

module.exports = router;
