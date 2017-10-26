// All the functions that will do the routing for the app,
//and the logic of each route.
var express = require('express');
var router = express.Router();
var mongoose = require("mongoose");

// The scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Mongoose mpromise deprecated - use bluebird promises
var Promise = require("bluebird");
mongoose.Promise = Promise;

// Requiring the Note and Article models
var Note = require("../models/Note.js");
var Article = require("../models/Article.js");

//Database configuration with mongoose
var dbURI = 'mongodb://localhost/webscraping';

if (process.env.NODE_ENV === 'production') {
    dbURI= "mongodb://heroku_w677159l:cn2kbl6l1cogrv4vf13g13iug8@ds133158.mlab.com:33158/heroku_w677159l";
}

// Database configuration with mongoose
mongoose.connect(dbURI);
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

//root route redirect to /index
router.get('/', function (req, res) {
  res.redirect('/index');
});

router.get('/index', function (req, res) {
    res.render("index");
  });

// A GET request to scrape the website
router.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("https://www.reddit.com/r/webdev/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    $("p.title").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object - var result.title = $(element).children().text(); OR
      result.title = $(this).children("a").text();
      // var result.link = $(element).children().attr("href"); OR
      result.link = $(this).children("a").attr("href");
      // save article title and link if it is an article and not a comment
      if (result.link.slice(0,4) == "http") {
        if (result.title && result.link) {
            //If a document exists with this title, don't add it to the db
            Article.find({ title: result.title }, function(err, exists) {
                if (exists.length) {
                    console.log('Article already exists');
                }
                else {

                    // Using our Article model, create a new entry, passing the result object to the entry (the title and link)
                    var entry = new Article(result);

                    // Now, save that entry to the db
                    entry.save(function(err, doc) {
                      // Log any errors
                      if (err) {
                        console.log(err);
                      }
                      // Or log the doc
                      else {
                        console.log(doc);
                      }
                    });
                }
            });
        }
      }
    });

  });
  // Tell the browser that we finished scraping the text
  res.json({});
});

// This will get the articles we scraped from the mongoDB
router.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// Grab an article by it's ObjectId
router.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});


// Create a new note or replace an existing note
router.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});

router.delete("/delete/:id", function (req, res) {

  Article.findById(req.params.id, function(err, article) {
      Note.findByIdAndRemove(article.note, function(err,note){
        Article.findOneAndUpdate({ "_id": req.params.id }, { "note": "" })
          .exec(function(err,doc) {
          console.log('\n\ndelete route - article' + article + "\n");
          console.log('\n');
          res.send(article);
          });
      });
  });

});


module.exports = router;
