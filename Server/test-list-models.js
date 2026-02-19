const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    // There isn't a direct listModels method on GenerativeModel, but let's check if the SDK exposes it.
    // Actually the SDK doesn't expose listModels in the main entry usually?
    // Wait, the error message says "Call ListModels".
    
    // I can try to access the model list through raw fetch if the SDK doesn't have it easily accessible in this version.
    // But let's try a simple fetch to the API.
    
    // const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    // But I don't have fetch in node < 18 by default (unless experimental).
    // I will use https module.
    
    const https = require('https');
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const fs = require('fs');
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        fs.writeFileSync('models.json', JSON.stringify(JSON.parse(data), null, 2));
      });
    }).on('error', (err) => {
      console.error(err);
    });

  } catch (err) {
    console.error(err);
  }
}

listModels();
