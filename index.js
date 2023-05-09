// TODO
// return languages correctly
// accept a list of languages
// Keep list of completed chunks and incomplete and retry queries until all complete.

require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const input = require("./test_translations.json");
const { encode, decode } = require("gpt-3-encoder");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function translate(input) {
  if (!configuration.apiKey) {
    console.log(
      "OpenAI API key not configured, please follow instructions in README.md"
    );
    return;
  }

  if (!input) {
    console.log("Input translations not received.");
    return;
  }

  const keys = Array.isArray(input) ? input : Object.keys(input);

  const chunks = chunkKeys(keys);
  // console.log("chunks", chunks);
  const result = [];
  // chunks.forEach((chunk) => {
  //   result.push(queryTranslation(chunk));
  // });
  //
  // return result;
}

const generatePrompt = (language, chunk) => {
  return [
    {
      role: "user",
      content: `Please return this json object with the values translated into ${language}. ${chunk}`,
    },
  ];
};

const queryTranslation = async (chunk) => {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0301",
      // prompt: generatePrompt("japanese", input),
      messages: generatePrompt("japanese", chunk),
      temperature: 0.0,
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
};

const getTokenCount = (str) => {
  return encode(str).length;
};

const chunkKeys = (keys) => {
  const tokensPerChunk = 1000;
  let chunks = [];
  let currentChunk = [];
  let currentChunkTokenCount = 0;

  for (let key of keys) {
    currentChunkTokenCount += getTokenCount(key);

    if (currentChunkTokenCount >= tokensPerChunk) {
      chunks.push(currentChunk);
      currentChunk = [key];
      currentChunkTokenCount = 0;
    }

    if (currentChunkTokenCount < tokensPerChunk) {
      currentChunk.push(key);
    }
  }

  if (currentChunk) chunks.push(currentChunk);

  console.log("chunkies", chunks);

  return chunks;
};

module.exports = {
  translate: translate,
};

(async () => {
  const result = await translate(input);
  // console.log(result);
  // const encoded = encode(JSON.stringify(input));
  // for (let token of encoded) {
  //   console.log({ token, string: decode([token]) });
  // }
  // console.log(chunkInput(input));
})();
