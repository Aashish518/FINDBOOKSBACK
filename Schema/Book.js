const mongoose = require("mongoose");
const { Schema } = mongoose;

const BookSchema = new Schema({
    BookId: {
        type: Schema.Types.ObjectId,
        primaryKey: true, 
    },
    BookName: {
        type: String,
        required: true,
        trim: true, 
    },
    BookImageURL: {
        type: String,
        maxLength: 250,
        trim: true,
    },
    Author: {
        type: String,
        required: true,
        trim: true,
    },
    Edition: {
        type: String,
        trim: true,
    },
    Publication_Date: {
        type: Date,
        required: true,
    },
    Publisher: {
        type: String,
        trim: true,
    },
    Description: {
        type: String,
        maxLength: 300, 
        trim: true,
    },
    Price: {
        type: Number,
        min: 1, 
    },
    ISBN: {
        type: String, 
        required: true,
    },
    Condition: {
        type: String,
        enum: ["fair", "excellent", "good"], 
    },
    Subcategory_id:{
        type:Schema.Types.ObjectId,
        ref:'Subcategory'
    },
    User_id:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    Isoldbook: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true }); 

const Books = mongoose.model('Books', BookSchema);
module.exports = Books;
