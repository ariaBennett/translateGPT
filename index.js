// TODO
// return languages correctly
// accept a list of languages
// Keep list of completed chunks and incomplete and retry queries until all complete.

require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const input = require("./test_translations.json");
const { encode } = require("gpt-3-encoder");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const isObject = function (a) {
  return !!a && a.constructor === Object;
};

const isArray = function (a) {
  return !!a && a.constructor === Array;
};

// TODO Json smart restructure
// Get source data

// While loop on object that builds queries out of blank values
//   and token based splits them
async function translate(input) {
  // Turn source into JSON object with blank values
  const formatInput = (input) => {
    const formattedInput = {};

    if (isObject(input)) {
      Object.keys(input).forEach((key) => {
        formattedInput[key] = "";
      });
    } else if (isArray(input)) {
      input.forEach((key) => {
        formattedInput[key] = "";
      });
    } else {
      console.log("Input must either be an object or an array.");
      return null;
    }

    return formattedInput;
  };

  const buildQueries = (formattedInput) => {
    const tokenLimit = 1000;
    const queries = [];
    let buildingTokens = 0;
    let buildingQuery = {};

    const getTokenCount = (str) => {
      return encode(str).length;
    };

    Object.keys(formattedInput).forEach((key) => {
      if (buildingTokens >= tokenLimit) {
        queries.push(JSON.stringify(buildingQuery));
        buildingTokens = 0;
        buildingQuery = {};
      }

      if (formattedInput[key] === "") {
        buildingQuery[key] = "";
        buildingTokens += getTokenCount(key) * 2 + 4;
      }
    });

    if (buildingQuery) {
      queries.push(JSON.stringify(buildingQuery));
    }

    return queries;
  };

  const formattedInput = formatInput(input);
  console.log("builtQueries", buildQueries(formattedInput));
}
// Try function on result from api to place the values into source json
// once while loop completes, return filled JSON

(async () => {
  const result = await translate(input);
  // console.log("result", result);
  // console.log(result);
  // const encoded = encode(JSON.stringify(input));
  // for (let token of encoded) {
  //   console.log({ token, string: decode([token]) });
  // }
  // console.log(chunkInput(input));
})();

async function translateOld(input) {
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
  for (const chunk of chunks) {
    const translation = await queryTranslation(chunk);
    result.push(JSON.parse(translation));
  }
  return buildOutput(keys, result.flat(1));
}

const generatePrompt = (language, chunk) => {
  return [
    {
      role: "user",
      content: `Please return this array with the values translated into ${language}. ${JSON.stringify(
        chunk
      )}`,
    },
  ];
};

const buildOutput = (originalArray, resultArray) => {
  const builtObject = {};
  originalArray.forEach((key, index) => {
    builtObject[key] = resultArray[index];
  });

  return builtObject;
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

  // console.log("chunkies", chunks);

  return chunks;
};

module.exports = {
  translate: translate,
};

(async () => {
  // const result = await translate(input);
  // console.log("result", result);
  // console.log(result);
  // const encoded = encode(JSON.stringify(input));
  // for (let token of encoded) {
  //   console.log({ token, string: decode([token]) });
  // }
  // console.log(chunkInput(input));
})();
