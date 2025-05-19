const mongoose = require("mongoose");

const connectToMongo = () => {
mongoose.connect("mongodb://localhost:27017/FINDBOOKS",{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>{
        console.log("connection successfully");
    }).catch(()=>{
        console.log("not connected");
    })
}

module.exports = connectToMongo;