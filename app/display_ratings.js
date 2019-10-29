"use strict";


/**
 * @description - This app makes calls to Freshdesk's satisfaction surveys api,
 * and display the user's previous survey responses for each ticket requester.
 *
 * This app demonstrates the following features
 * 1 - Data API: Get domain name, ticket requester id
 * 2 - Request & Satisfaction Survey API: Get survey response filtered by ticket
 *     requester id
 * 3 - Interfae API: Navigate to the ticket where the survey was issued
 */

const ratings_dic = {
  "103": "Extremely Happy",
  "102": "Very Happy",
  "101": "Happy",
  "100": "Neutral",
  "-101": "Unhappy",
  "-102": "Very Unhappy",
  "-103": "Extremely Unhappy",
  "1": "Happy",
  "2": "Neutral",
  "3": "Unhappy"
};

$(document).ready(function () {
  app.initialized().then(
    function (_client)
    {
      window.client = _client;
      client.events.on("app.activated", init);
    },
    function (error) {
      alert(error.status + ": " + error.response + ", Please reach out to IT team");
    }
  );

  function init() {
    // get domain name
    var domain = "";
    client.data.get('domainName').then(
      function (data)
      {
        domain = data.domainName;
        getTicketData(domain);
      },
      function (error) {
        alert(error.status + ": " + error.response + ", Please reach out to IT team");
      }
    );
  }

  // get requester_id for current ticket
  function getTicketData(domain){
    client.data.get('ticket').then(
      function (data)
      {
        var ticket_user_id = data.ticket.requester_id;
        request(domain, ticket_user_id);
      },
      function (error) {
        alert(error.status + ": " + error.response + ", Please reach out to IT team");
      }
    );
  }

  // get all previous satisfaction ratings of the ticket requester
  function request(domain, ticket_user_id) {
    const options = {
      headers:{
        "Authorization": "<%= encode(iparam.api_key) %>"
      }
    };
    const url = `https://${domain}/api/v2/surveys/satisfaction_ratings?user_id=${ticket_user_id}`;

    client.request.get(url, options).then(
      function (data) {
        var search_results = JSON.parse(data.response);

        $(".ratings").empty();

        if (search_results.length == 0) {
          $("#survey-stats").append("No response found.")
        } else {
          processData(search_results);
        }
      },
      function (error) {
        alert(error.status + error.response + ", Please reach out to IT team");
      }
    );
  }

  function processData(data){
    var list = $("#survey-list");
    var rating_stats = {
      "Extremely Happy": 0,
      "Neutral": 0,
      "Extremely Unhappy": 0
    };

    $.each(data, function(i, item){

      // skipping ticket 11 because it has been deleted
      // due to double rating
      if (item.ticket_id == 11) {
        return;
      }

      // replace rating value with rating description
      // eg: 103 -> Extremely Happy
      var ratings = item.ratings.default_question + "";
      ratings = ratings_dic[ratings]

      // calculate counts per rating for summary stats
      rating_stats[ratings] += 1;

      var creation_time = (new Date(item.updated_at)).toLocaleString();

      // show response creation time, satisfaction rating, and link to ticket
      // as survey response records
      var result = `<li class="survey-result">${creation_time}, ${ratings}</li>
                    <a href="#" data-id=${item.ticket_id} class="ticket-link">Jump to ticket...</a>`;
      list.append(result);
    })

    // append rating counts above survey response records
    $.each(rating_stats, function(i, item) {
      $("#survey-stats").append(`<p class="ratings-list">${i}: ${item}</p>`);
    })

    // navigate to ticket detail if user click on link
    $(".ticket-link").click(function () {
      client.interface.trigger("click", {id: "ticket",
                                         value: +$(this).data('id')})
      .then(function(data) {
        console.log("success");
      }).catch(function(error) {
        alert(error.status + error.response + ", Please reach out to IT team");
      });
    })
  }
});
