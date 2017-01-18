const express = require("express");

var app = express();

app.use(require("morgan")("dev"));
app.use(express.static("static"));

app.listen(8080, function() {
    console.log("Web server running on port 8080");
});
