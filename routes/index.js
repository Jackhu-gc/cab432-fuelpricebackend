var express = require("express");
var router = express.Router();
const Axios = require("axios");
const headers = {
  Authorization: "FPDAPI SubscriberToken=ea92a388-5358-44e1-a765-6aa9c4cb2cd0",
  "Content-Type": "application / json"
};
router.get("/fueltypes", function(req, res, next) {
  const url =
    "https://fppdirectapi-prod.fuelpricesqld.com.au/Subscriber/GetCountryFuelTypes?countryId=21";

  Axios.get(url, { headers }).then(response => {
    res.status(200).json({
      Fuels: response.data.Fuels
    });
  });
});

router.get("/sites", function(req, res, next) {
  const url =
    "https://fppdirectapi-prod.fuelpricesqld.com.au/Subscriber/GetFullSiteDetails?countryId=21&geoRegionLevel=3&geoRegionId=1";

  Axios.get(url, { headers }).then(response => {
    res.status(200).json({
      S: response.data.S
    });
  });
});

module.exports = router;
