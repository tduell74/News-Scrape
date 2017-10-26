function scrapeArticles () {
      console.log('in scrapeArticles');
      var data={};
    $.getJSON("/scrape", function(data) {
        console.log('successful scrape');
        console.log('data from scrape', data);
        getArticles();

    });
}

function getArticles () {
  console.log('in getArticles');
    $.getJSON("/articles", function(data) {
      console.log(data);
      
      for (var i = 0; i < data.length; i++) {
          // Display the information on the page
          $("#articles").append("<p data-id='" + data[i]._id + "'>" + data[i].title + "</p>");
          $("#articles").append("<a data-id='" + data[i]._id + "' href='"   + data[i].link + "' target='about_blank'>" + data[i].link + "</a>");
          console.log('\n\nappending articles to page');
      }
    });
}

scrapeArticles();

$(document).on("click", "p", function() {
  
  $("#notes").empty();
 
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    
    .done(function(data) {
      console.log(data);
      // The title of the article
      $("#notes").append("<p class='title'>" + data.title + "</p>");
      // An input to enter a new title
    
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");
      $("#notes").append("<button data-id='" + data._id + "' id='deletenote'>Delete Note</button>");
      // If there's a note in the article
      if (data.note) {
        
        $("#bodyinput").val(data.note.body);
      }
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      body: $("#bodyinput").val()
    }
  })
    .done(function(data) {
      $("#notes").empty();
    });

  $("#bodyinput").val("");
});


$(document).on("click", "#deletenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  $.ajax({
    method: "DELETE",
    url: "/delete/" + thisId,
  })
 
    .done(function(data) {
      // Log the response
      console.log('app.js delete - data',data);
      
      $("#notes").empty();
    });

  // Also, remove the values entered in the  textarea for note entry
  $("#bodyinput").val("");
});
