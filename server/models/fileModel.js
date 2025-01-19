const mongoose = require("mongoose");
const fileSchema = new mongoose.Schema(
  {
    file: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return value.length <= 255;
        },
        message: "File size must be less than or equal to 5MB",
      },
    },
  },
  { timestamps: true }
);

const User_File = mongoose.model("User_File", fileSchema);

module.exports = User_File;
