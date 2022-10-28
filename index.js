const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

dotenv.config();

const teachers = require("./controllers/teachers");

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors({
  origin: ["https://cmsweb.cms.cpp.edu", "https://vercel.app", "https://broncodirectplus.vercel.app/"]
}));

app.use(express.json());

app.use(express.static("public"));

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/public/index.html");
});

app.use("/", teachers);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});