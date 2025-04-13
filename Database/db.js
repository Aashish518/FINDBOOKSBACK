const mongoose = require("mongoose");

const connectToMongo = () => {
    mongoose.connect(process.env.DATABASE_CONNECTION_STRING,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>{
        console.log("connection successfully");
}).catch((error) => {
        console.log(error)
        console.log("not connected");
    })
}

module.exports = connectToMongo;