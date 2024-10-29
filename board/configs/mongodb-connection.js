const {mongoClient, MongoClient} = require("mongodb");

const uri = "mongodb+srv://skyko6530:tkadlf31@cluster0.zucklek.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/board";

module.exports = function (callback) {
    return MongoClient.connect(uri, callback);
}