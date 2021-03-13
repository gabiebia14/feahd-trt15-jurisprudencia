"use strict";

const fs = require("fs");
const puppeteer = require("puppeteer-extra");
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");

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

const movimentacao2gTRT15 = async () => {
  const solver = new Captcha.Solver("47ae74f9cc317c176aea497acdfb939f");

  let resultados = [];

  const browser = await puppeteer.launch({
 //   headless: false, // Mudar para false para ver a janela do browser
    slowMo: 50, // Adiciona um tempo em milissegundos entre cada ação
  });

  const page = await browser.newPage();

  //page.setDefaultTimeout(90000);

  // page.on("pageerror", function(err) {  
  //   let theTempValue = err.toString();
  //   console.log("Page error: " + theTempValue); 
  //   process.exit(1);
  // });
  
  // page.on("error", function (err) {  
  //   let theTempValue = err.toString();
  //   console.log("Error: " + theTempValue); 
  //   process.exit(1);
  // });

  process.on('unhandledRejection', err => {
    let theTempValue = err.toString();
    console.log("Error: " + theTempValue); 
    process.exit(1);
  });

  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  let file1 = fs.readFileSync("movimentos_trt15.json");
  //let file1 = fs.readFileSync("entrega/ato_discriminatorio_trt15.json");
  //let file1 = fs.readFileSync("entrega/teste.json");
  let juris = JSON.parse(file1);

  let contador = 0;
  for (var proc in juris) {
    contador += 1;
    console.log(`Contador: ${contador}/${juris.length}`);

    // if(juris[proc].movimentos.length === 0) {
    //   console.log("Processo zerado: ", juris[proc].processo);
    // }

    if(juris[proc].movimentos) continue;
    var nr_processo = juris[proc].processo;

    await page.goto(
      `https://pje.trt15.jus.br/consultaprocessual/detalhe-processo/${nr_processo}/2`,
      { waitUntil: "domcontentloaded" }
    );

    const { captchas, error: _ } = await page.findRecaptchas(page);

    if (captchas.length) {
      await page.solveRecaptchas();
      let nav = page.waitForNavigation({ waitUntil: "networkidle2" });
      try {
        await page.click('button[type="submit"]');
      } catch (e) {
        await page.click('input[type="submit"]');
      }
      await nav;
    }

    let imagemCaptchaSelector = "#imagemCaptcha";
    await page.waitForSelector(imagemCaptchaSelector);

    const captchaSimples = await page.evaluate((imagemCaptchaSelector) => {
      img = document.querySelector(imagemCaptchaSelector);
      captcha = img.src.replace(/^data:image\/png;base64,/, "");
      return captcha;
    }, imagemCaptchaSelector);

    let resultadoResolucaoImagem = await solver.imageCaptcha(captchaSimples);
    let captchaResolvido = resultadoResolucaoImagem.data;

    console.log("Captcha resolvido: ", captchaResolvido);

    await page.type("#captchaInput", captchaResolvido);

    let nav = page.waitForNavigation({ waitUntil: "networkidle2" });
    try {
      await page.click('button[type="submit"]');
    } catch (e) {
      await page.click('input[type="submit"]');
    }
    await nav;

    // Salvar o resultado da pesquisa
    const salvarResultado = async () => {
      const movimentosSelector = 'div[name="tipoItemTimeline"] i';
      await page.waitForSelector(movimentosSelector);

      console.log(`Processo ${nr_processo}`);

      const resultadosRetornados = await page.evaluate((movimentosSelector) => {
        const itens = Array.from(document.querySelectorAll(movimentosSelector));

        const datasSelector = "footer";
        const datas = Array.from(document.querySelectorAll(datasSelector));

        console.log(`Total de movimentos: ${itens.length}\n`);

        return itens.map((movimento, idx) => {
          mov = {};
          mov.texto = movimento.getAttribute("aria-label");
          mov.data = datas[idx].getAttribute("title");
          //console.log(mov.texto);
          //console.log(mov.data);
          return mov;
        });
      }, movimentosSelector);

      return resultadosRetornados;
    };

    let movimentos = await salvarResultado();
    await page.waitForTimeout(2000);
    //resultados.push({ processo: nr_processo, movimentos: movimentos });
    juris[proc].movimentos = movimentos;
    let json = JSON.stringify(juris, null, 2);
    fs.writeFileSync("movimentos_trt15.json", json);
  }

  await browser.close();
  console.log("Fim da busca de movimentação processual.");
  // Salvar os resultados em um arquivo no formato JSON.
  //console.log("Salvando resultados em arquivo JSON...")
  let json = JSON.stringify(juris, null, 2);
  fs.writeFileSync("movimentos_trt15.json", json);
};

/* --------------------------------------------------
 * Executar pesquisa jurisprudencial no site do TRT15
 * --------------------------------------------------
 *
 * ------------------
 * Parâmetros atuais:
 * ------------------
 *
 * 1. Trecho exato: ato discriminatório
 *
 */

movimentacao2gTRT15();
