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
  
    // Navegar até a página da pesquisa e aguardar carregar
    await page.goto(
      "https://pje.trt15.jus.br/consultaprocessual/detalhe-processo/0011995-32.2018.5.15.0003/2",
      { waitUntil: "domcontentloaded" }
    );
  
    await page.solveRecaptchas();

    try {
      await page.click('button[type="submit"]');
    }
    catch (e) {
      await page.click('input[type="submit"]');
    }

    await page.waitForNavigation({waitUntil: 'networkidle2'});

    const captchaSimples = await page.evaluate(() => {
        img = document.querySelector('#imagemCaptcha');
        console.log(img.src);
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

      const resultadosRetornados = await page.evaluate(() => {

        const movimentos = Array.from(document.querySelectorAll('div[name="tipoItemTimeline"] i')).map((item) => item.getAttribute('aria-label'));
        const datas = Array.from(document.querySelectorAll('footer')).map((item) => item.getAttribute('title'));
  
        console.log(movimentos);
        console.log(datas);
        
        // return movimentos.forEach((texto, indice) => {
        //   mov = {};
        //   mov.texto = texto;
        //   mov.data = datas[indice];
        //   return mov;
        // });
      });
  
      return resultadosRetornados;
    };
  

    
    let movimentos = await salvarResultado();
    
    //debugger;

    resultados.push(...movimentos);
    
  
    // Salvar os resultados em um arquivo no formato JSON.
    console.log("Salvando resultados em arquivo JSON...")
    let json = JSON.stringify(resultados, null, 2);
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
  