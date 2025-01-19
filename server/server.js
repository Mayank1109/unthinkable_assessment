const app = require("./app");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`server Started on port ${port}`);
});
