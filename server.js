const express = require("express");
const app = express();
require("dotenv").config();

const cors = require("cors");
//Connecting to database
// const dbConnect = require('./config/connectDB');
// dbConnect();
app.use(cors({ origin: "http://localhost:3000" }));
//setting a public folder named assets
app.use(express.static("assets"));

app.use(express.json());
// use routes
app.use("/auth", require("./src/routes/authRoute"));
app.use("/transaction", require("./src/routes/transactionRoute"));
app.use("/retailer", require("./src/routes/retailerRoute"));
app.use("/subWholesaler", require("./src/routes/subWholesalerRoute"));
app.use("/wholesaler", require("./src/routes/wholesalerRoute"));
app.use("/SuperAdmin", require("./src/routes/superAdminRoute"));
app.use("/mvno", require("./src/routes/mvnoRoute"));
app.use("/bundle", require("./src/routes/bundleRoute"));
app.use("/payment", require("./src/routes/paymentRoute"));
app.use("/topup/bundle", require("./src/routes/topupBundleRoute"));
app.use("/topup/light", require("./src/routes/topupLightRoute"));
app.use("/topup", require("./src/routes/topupRoute"));

//root route
app.get("/", (req, res) => {
  res.send("Asel pay server!");
});
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
