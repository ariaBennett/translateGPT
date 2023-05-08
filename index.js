require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function translate(source) {
  if (!configuration.apiKey) {
    console.log(
      "OpenAI API key not configured, please follow instructions in README.md"
    );
    return;
  }

  if (!source) {
    console.log("Source translations not received.");
    return;
  }

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0301",
      // prompt: generatePrompt("japanese", source),
      messages: generatePrompt("japanese", source),
      temperature: 0.6,
    });
    return completion.data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
    }
  }
}

const generatePrompt = (language, source) => {
  return [
    {
      role: "user",
      content: `Please return this json object with the values translated into ${language}. ${JSON.stringify(
        source
      )} `,
    },
  ];
};

module.exports = {
  translate: translate,
};

(async () => {
  const result = await translate({ taco: "taco", bees: "bees" });
  console.log(result);
})();
