const mongoose = require("mongoose");

const connectToMongo = () => {
    mongoose.connect("mongodb+srv://jadavaashish9:An%40211518@cluster0.gtxxzpc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>{
        console.log("connection successfully");
    }).catch(()=>{
        console.log("not connected");
    })
}

module.exports = connectToMongo;