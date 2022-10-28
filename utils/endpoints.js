const axios = require("axios");

const RMP = axios.create({
  baseURL: "https://www.ratemyprofessors.com",
  headers: {
    "Type": "application/json",
    "Authorization": `Bearer ${process.env.USER_TOKEN}`
  }
});

module.exports = {
  RMP
}