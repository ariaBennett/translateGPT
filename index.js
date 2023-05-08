// TODO
// return languages correctly
// accept a list of languages

require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const source = require("./test_translations.json");
const { encode, decode } = require("gpt-3-encoder");

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
    console.log(completion.data.choices[0]);
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

const chunkSource = (source) => {
  const tokensPerChunk = 1500;
  const encoded = encode(JSON.stringify(source));
  let chunks = [];
  let currentChunk = "";
  let currentChunkTokenCount = 0;

  for (let token of encoded) {
    currentChunk = currentChunk + decode([token]);
    currentChunkTokenCount++;
    if (currentChunkTokenCount === tokensPerChunk) {
      chunks.push(currentChunk);
      currentChunk = "";
      currentChunkTokenCount = 0;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

module.exports = {
  translate: translate,
};

(async () => {
  // const result = await translate(source);
  // console.log(result);
  // const encoded = encode(JSON.stringify(source));
  // for (let token of encoded) {
  //   console.log({ token, string: decode([token]) });
  // }
  console.log(chunkSource(source));
})();
