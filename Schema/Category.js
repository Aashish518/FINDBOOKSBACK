const mongoose = require("mongoose");
const { Schema } = mongoose;

const CategorySchema = new Schema({
    Category_id: {
        type: Schema.Types.ObjectId,
        primary_key : true
    },
    Category_Name: {
        type: String,
        required: true,
        trim: true, 
    },
}, { timestamps: true }); 

module.exports = mongoose.model("Category", CategorySchema);