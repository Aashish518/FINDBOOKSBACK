const mongoose = require("mongoose");
const { Schema } = mongoose;

const SubcategorySchema = new Schema({
    Subcategory_id: {
        type: Schema.Types.ObjectId,
        primary_key : true
    },
    Subcategory_Name: {
        type: String,
        required: true,
        trim: true, 
    },
    Category_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Category", 
    },
}, { timestamps: true }); 

module.exports = mongoose.model("Subcategory", SubcategorySchema);