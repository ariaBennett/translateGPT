require("dotenv").config();

const translate = (source) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Please set the OPENAI_API_KEY environment variable");
  }
  console.log(source);
  console.log(apiKey);
};

translate({ hi: "meow" });

module.exports = {
  translate: translate,
};
