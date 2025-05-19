const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrderSchema = new Schema({
    Cart_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Cart", 
    },
    books: [
        {
            book_id: {
                type: Schema.Types.ObjectId,
                ref: 'Book',
            },
            book_quantity: {
                type: Number,
                min: 1
            },
        }
    ],
    Address: {
        type: String,
        required: true,
        trim: true, 
    },
    Order_Date: {
        type: Date,
        required: true,
        default: Date.now, 
    },
    Total_Amount: {
        type: Number,
        min: 0, 
    },
    User_id:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    Order_Status: {
        type: String,
        trim: true,
        default: "Pending",
        enum: ["Pending", "Shipped", "Delivered", "Cancelled", "Return"], 
    },
    Delivery_User_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true }); 

module.exports = mongoose.model("Order", OrderSchema);