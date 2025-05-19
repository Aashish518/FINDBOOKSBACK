const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
    User_id: {
        type : Schema.Types.ObjectId,
        primaryKey: true,
    },
    First_name: {
        type: String,
        required: true,
        trim: true, 
    },
    Last_name: {
        type: String,
        required: true,
        trim: true,
    },
    Email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
    },
    Phone_no: {
        type: String,
        required: true,
        trim: true, 
    },
    Password: {
        type: String,
        required: true,
        minlength: 6, 
    },

    Role: {
        type: String,
        required: true,
        enum: ["User", "Admin", "Deliveryperson"],
        default: "User",
    },
    
    otp: {
        type: String
    },
    
}, { timestamps: true }); 

module.exports = mongoose.model("User", UserSchema);