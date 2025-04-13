const express = require("express");
const app = express();
const connectToMongo = require("./Database/db")
const cors = require("cors");
const PORT = process.env.PORT || 2606;
const cookieparser = require('cookie-parser');
const dotenv = require("dotenv");
const reportRoutes = require('./Routes/report');
dotenv.config();


app.use(cors({
    origin: true, 
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    allowedHeaders: ["Content-Type", "Authorization"], 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

connectToMongo();

app.use("/uploads", express.static("uploads"));
app.use("/api", require("./Routes/Auth"));
app.use("/api", require("./Routes/BookForm"));
app.use("/api", require("./Routes/Addcat-subCat"));
app.use("/api", require("./Routes/ResellerPaymentForm"));
app.use("/api", require("./Routes/AddToCart"));
app.use("/api", require("./Routes/Checkout"));
app.use("/api", require("./Routes/Profile"));
app.use("/api", require("./Routes/AddRatings"));
app.use("/api", require("./Routes/SellOrders"));
app.use("/api", require("./Routes/Payment"));
app.use('/api/report', reportRoutes);

app.listen(PORT,'0.0.0.0',() => {
    console.log(`your application run at http://localhost:${PORT}`);
})