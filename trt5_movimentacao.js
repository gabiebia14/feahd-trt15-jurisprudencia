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
        debugger;
        captcha = img.src.replace(/^data:image\/png;base64,/, "");
        return captcha;
      });

    debugger;
    
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
  
      // Seletor que indica o item da lista retornada
      const resultsSelector = "ul.ul_result_juris li";
      await page.waitForSelector(resultsSelector);
  
      // Parsing do html retornado pela pesquisa
      const resultadosRetornados = await page.evaluate((resultsSelector) => {
  
        // Buscar a lista de itens retornados na página
        const itens = Array.from(document.querySelectorAll(resultsSelector));
  
        // Para cada item retornado...
        return itens.map((processo) => {
  
          // Buscar as informações do item "Data publicação", "Ano do processo", etc.
  
          // Seletor que indica onde estão as informações do item retornado
          const informacoesSelector = "p span"
          const informacoes = Array.from(processo.querySelectorAll(informacoesSelector));
  
          // Parsing do item retornado
          juris = {};
  
          // Número do processo e link para a consulta de andamentos
          var a_links = Array.from(processo.getElementsByTagName('a'));
          juris.processo = a_links[0].text.split(' ')[3];
          juris.andamentoslink = a_links[1].href;
  
          // Informações da publicação
          juris.datapublicacao = informacoes[0].textContent.split(':')[1].trim();
          juris.anoprocesso = informacoes[1].textContent.split(':')[1].trim();
          juris.orgaojulgador = informacoes[2].textContent.split(':')[1].trim();
          juris.relator = informacoes[3].textContent.split(':')[1].trim();
          juris.textoparcial = informacoes[4].textContent.trim();
  
          // Retornar item após parsing
          return juris;
        });
  
      }, resultsSelector);
  
      // Retorna lista de resultados encontrados na página
      return resultadosRetornados;
    };
  
    let contadorPaginas = 1;
    // Salvar os resultados da 1ª página
    console.log(`Resultados da página ${contadorPaginas} - OK`);
    let processos = await salvarResultado();
    resultados.push(...processos);
  
    // Verificar se existe paginação dos resultados
    // Caso exista, clicar para avançar a página (>)
  
    // Seletor que indica onde está o paginador
    const paginacao = "a.pagination-link.right-0.featured";
  
    // Passar para a próxima página
    const getProximaPagina = async () => {
  
      // Tem a setinha para a direta (>) indicando que existe próxima página?
      const setinhaDireitaClicada = await page.evaluate((paginacao) => {
        const linksPaginacao = Array.from(document.querySelectorAll(paginacao));
        proximaPagina = linksPaginacao.filter((link) => link.textContent === ">");
  
        if (proximaPagina.length != 0) {
          // Caso a setinha tenha sido encontrada, clicar nela.
          proximaPagina[0].click();
          return true;
        } else {
          return false;
        }
      }, paginacao);
  
      // Retorna "true" caso exista nova página com mais resultados a serem processados.
      return setinhaDireitaClicada;
    };
  
    // A partir de agora, salvar os resultados da página atual e passar para a próxima
    // até que não existam mais páginas.
    while (true) {
      let proximaPagina = await getProximaPagina();
      if (!proximaPagina) break;
      
      contadorPaginas++;
  
      console.log(`Resultados da página ${contadorPaginas} - OK`);
      await page.waitForNavigation({waitUntil: 'networkidle2'});
      processos = await salvarResultado();
      resultados.push(...processos);
    }
  
    // Consulta concluída. Fechar o browser.
    await browser.close();
  
    // Salvar os resultados em um arquivo no formato JSON.
    console.log("Salvando resultados em arquivo JSON...")
    let json = JSON.stringify(resultados, null, 2);
    fs.writeFileSync('ato_discriminatorio_trt15.json', json);
  
    console.log("\n### Fim da pesquisa automatizada ###");
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
  