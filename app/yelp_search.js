"use strict";

/**
 * @description - This app takes user input and makes request to Yelp Fusion API
 * to search for matching records. It pulls thrid-party data into Freshdesk.
 *
 * This app demonstrates the following features
 * 1 - Freshdesk's Request API: Get data from Yelp
 */

const BASE_URL = "https://api.yelp.com/v3/businesses/search";

$(document).ready(function () {
  app.initialized().then(
    function (_client) {
      window.client = _client;
      client.events.on("app.activated", init);
    },
    function (error) {
      alert(error.status + ": " + error.response + ", Please reach out to IT team");
    }
  );

  function init() {
    $("#search-btn").click(function (e) {
      e.preventDefault();

      //show loader
      $(".dot").show();

      //remove existing serch results
      if ($("#result-list").children().length > 0) {
        $("#result-list").empty();
      }

      // get user input
      var user_input = $('#user-input').val();
      var user_location = $('#user-location').val();

      var options = {
        headers:{
          "Authorization": "Bearer <%= iparam.yelp_api_key %>"
        }
      };
      var url = BASE_URL + `?term=${user_input}&location=${user_location}&limit=5`
      // send request through Freshworks Request API
      req(url, options);
    });
  }

  function req(url, options) {
    client.request.get(url, options).then(
      function (data) {
        // hide loader after receiving response
        $(".dot").hide();
        processData(data);
      },
      function (error) {
        // hide loader after receiving response
        $(".dot").hide();
        alert(error.status + ", " + error.response + ", Please reach out to IT team");
      }
    );
  }

  function processData(data) {
    var search_results = JSON.parse(data.response);
    $.each(search_results.businesses, function(i, item){
      var name = item.name;
      var url = item.url;
      var address = item.location.display_address;
      var phone = item.display_phone;

      var link = "<a href=" + url + ">" + name + "</a>";
      var list = $("#result-list");

      // check if business infomation is missing
      if (!phone) {
        phone = "(No phone number)";
      }
      if (!address) {
        phone = "(No address)";
      }

      // append search result to result list
      list.append("<li class=“result”>" + link + "</li>")
      .append("<span class=“result”>" + address + ", " + phone+ "</span>");
    });
  }
});
