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

  const generatePrompt = (query, language) => {
    return [
      {
        role: "user",
        content: `Please return this JSON object with the values translated into ${language}. ${query}`,
      },
    ];
  };

  const sendQuery = async (query, language) => {
    try {
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-0301",
        messages: generatePrompt(query, language),
        temperature: 0.0,
      });
      console.log("Query response: ", completion.data.choices[0]);
      return completion.data.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.error(error.response.status, error.response.data);
      } else {
        console.error(`Error with OpenAI API request: ${error.message}`);
      }
    }
  };

  const generateAppliedResponse = (response, buildingOutput) => {
    let appliedResponse = buildingOutput;
    let parsedResponse;

    try {
      parsedResponse = JSON.parse(response);
      console.log("Parsed response: ", parsedResponse);
    } catch {
      console.log(`Response parse error, retrying. Response: ${response}`);
      return buildingOutput;
    }

    Object.keys(parsedResponse).forEach((key) => {
      if (appliedResponse[key] === "") {
        appliedResponse[key] = parsedResponse[key];
      }
    });
    return appliedResponse;
  };

  let buildingOutput = formatInput(input);
  console.log("buildOut", buildingOutput);
  let isOutputBuilt = false;

  while (!isOutputBuilt) {
    const queries = buildQueries(buildingOutput);
    console.log("Queries", queries);

    for (let query in queries) {
      const queryResponse = await sendQuery(queries[query], "japanese"); // Todo pass language
      console.log("Query response: ", queryResponse);

      buildingOutput = generateAppliedResponse(queryResponse, buildingOutput);
      console.log("Building output", buildingOutput);
    }

    if (queries === ["{}"]) {
      isOutputBuilt = true;
    }
  }

  console.log("build output", buildingOutput);
  return buildingOutput;
}
// Try function on result from api to place the values into source json
// once while loop completes, return filled JSON

(async () => {
  const result = await translate(input);
})();

module.exports = {
  translate: translate,
};
