// Require mongoose
var mongoose = require("mongoose");
// Create a schema class
var Schema = mongoose.Schema;

// Create the Note schema
var NoteSchema = new Schema({
  
  title: {
    type: String,
    trim: true
  },
  
  body: {
    type: String,
    trim: true
  }
});



var Note = mongoose.model("Note", NoteSchema);

// Export the Note model
module.exports = Note;
