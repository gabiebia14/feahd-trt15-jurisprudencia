"use strict";

const fs = require("fs");
const puppeteer = require("puppeteer-extra");
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
const { htmlToText } = require('html-to-text');

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "47ae74f9cc317c176aea497acdfb939f",
    },
    visualFeedback: true,
  })
);

const Captcha = require("2captcha");

/* ---------------------
 * Automação da pesquisa
 * ---------------------
 */

const acordaoTRT15 = async () => {
  const solver = new Captcha.Solver("47ae74f9cc317c176aea497acdfb939f");

  const browser = await puppeteer.launch({
    headless: false, // Mudar para false para ver a janela do browser
    slowMo: 100, // Adiciona um tempo em milissegundos entre cada ação
  });

  const page = await browser.newPage();

  process.on('unhandledRejection', err => {
    let theTempValue = err.toString();
    console.log("Error: " + theTempValue); 
    process.exit(1);
  });

  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  let file1 = fs.readFileSync("entrega/movimentos_trt15.json");
  let juris = JSON.parse(file1);

  let contador = 0;
  for (var proc in juris) {
    contador += 1;
    console.log(`Contador: ${contador}/${juris.length}`);

    if(juris[proc].textoIntegral) continue;
    var nr_processo = juris[proc].processo;

    await page.goto(
      `${juris[proc].acordaoLink}`,
      { waitUntil: "domcontentloaded" }
    );

    //await page.waitForNavigation({ waitUntil: "networkidle2" });
    
    const html = await page.content();
    const acordao = htmlToText(html, {
      wordwrap: 130
    });

    juris[proc].textoIntegral = acordao;
    let json = JSON.stringify(juris, null, 2);
    console.log('Salvando acordão do processo', nr_processo);
    fs.writeFileSync("entrega/movimentos_trt15.json", json);
    //fs.writeFileSync(`acordaos/${nr_processo}.txt`, acordao);
    await page.waitForTimeout(2000);
  }

  await browser.close();
};

acordaoTRT15();
