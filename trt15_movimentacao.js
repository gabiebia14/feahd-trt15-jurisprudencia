"use strict";

const fs = require('fs');
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

    // Guarda os itens retornados pela pesquisa
    let resultados = [];
  
    // Inicia o browser
    const browser = await puppeteer.launch({
      headless: false, // Mudar para false para ver a janela do browser
      slowMo: 100 // Adiciona um tempo em milissegundos entre cada ação
    });
  
    // Nova página
    const page = await browser.newPage();

    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  
    // Navegar até a página da pesquisa e aguardar carregar
    await page.goto(
      `https://pje.trt15.jus.br/consultaprocessual/detalhe-processo/${nr_processo}/2`,
      { waitUntil: "domcontentloaded" }
    );
  
    await page.solveRecaptchas();
    //await page.waitFor(5000);

    let nav = page.waitForNavigation({waitUntil: 'networkidle2'});
    try {
      await page.click('button[type="submit"]');
    }
    catch (e) {
      await page.click('input[type="submit"]');
    }
    await nav;

    const captchaSimples = await page.evaluate(() => {
        img = document.querySelector('#imagemCaptcha');
        captcha = img.src.replace(/^data:image\/png;base64,/, "");
        return captcha;
      });
    
    let resultadoResolucaoImagem = await solver.imageCaptcha(captchaSimples);
    let captchaResolvido = resultadoResolucaoImagem.data;

    console.log("Captcha resolvido: ", captchaResolvido);

    await page.type("#captchaInput", captchaResolvido);

    try {
      await page.click('button[type="submit"]');
    }
    catch (e) {
      await page.click('input[type="submit"]');
    }
    
    // Salvar o resultado da pesquisa
    const salvarResultado = async () => {

      const movimentosSelector = 'div[name="tipoItemTimeline"] i';

      const resultadosRetornados = await page.evaluate((movimentosSelector) => {

        const itens = Array.from(document.querySelectorAll(movimentosSelector));

        const datasSelector = 'footer';
        const datas = Array.from(document.querySelectorAll(datasSelector));
        
        return itens.map((movimento, idx) => {
          mov = {}
          mov.texto = movimento.getAttribute('aria-label');
          mov.data = datas[idx].getAttribute('title');
          console.log(mov.texto);
          console.log(mov.data);
          return mov;
        });  
      }, movimentosSelector);
  
      return resultadosRetornados;
    };
  

    
    let movimentos = await salvarResultado();
   
    
  
    // Salvar os resultados em um arquivo no formato JSON.
    //console.log("Salvando resultados em arquivo JSON...")
    let json = JSON.stringify(movimentos, null, 2);
    fs.writeFileSync('movimentos_trt15.json', json);

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
  