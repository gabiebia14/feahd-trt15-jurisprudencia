"use strict";

/* ---------------------------
 * Carregando libs necessárias
 * ---------------------------
 */

// Filesystem
const fs = require('fs');

// Puppeteer com suporte para plugins
const puppeteer = require("puppeteer-extra");

// Plugin para resolver captchas
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");


/* -------------
 * Configurações
 * ------------- 
 */

// Configuração do plugin de captchas
// Provedor atual: 2captcha (possível configurar outros)
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "47ae74f9cc317c176aea497acdfb939f",
    },
    visualFeedback: true, // Colorir recaptcha - roxo = detectado, verde = resolvido.
  })
);


/* ---------------------
 * Automação da pesquisa
 * ---------------------
 */

const jurisprudenciaTRT15 = async () => {

  console.log("### Início da pesquisa automatizada ###\n");

  // Guarda os itens retornados pela pesquisa
  let resultados = [];

  // Inicia o browser
  const browser = await puppeteer.launch({
    headless: false, // Mudar para false para ver a janela do browser
    slowMo: 100 // Adiciona um tempo em milissegundos entre cada ação
  });
  console.log("Browser - OK");

  // Nova página
  const page = await browser.newPage();
  console.log("Nova aba - OK");

  // Navegar até a página da pesquisa e aguardar carregar
  console.log("Site do TRT15 - OK");
  await page.goto(
    "https://busca.trt15.jus.br/search?site=jurisp&client=dev_index&output=xml_no_dtd&proxystylesheet=dev_index&oe=UTF-8&ie=UTF-8&ud=1&filter=0&lr=lang_pt&getfields=*&lr=lang_pt",
    { waitUntil: "domcontentloaded" }
  );



   // Preencher o campo "Órgão julgador PJe", selecionando "8ª Câmara"
   //await page.select("#trt_emissor_pje", "17");
   //console.log("Campo 'Órgão julgador PJe' = 8ª Câmara - OK");

  // Preencher o campo "Trecho exato"
//  await page.type("#as_epq", "ato discriminatório");
//  console.log("Campo 'Trecho exato' = ato discriminatório - OK");

await page.type("input[name='q']", "ato discriminatório");
await page.type("#as_oq", "mulher mulheres genero sexo feminino");
await page.select("#ano_inicio", '2017');
//await page.select("#ano_final", '2016');
//console.log("Campo 'Trecho exato' = ato discriminatório - OK");

 

  // Resolver o Recaptcha da página
  console.log("Resolvendo Captcha, aguarde...");
  await page.solveRecaptchas();
  console.log("Captcha - OK");

  // Clicar no botão "Pesquisar"
  console.log("Botão 'Pesquisar' - OK");
  await page.click("#submeter");

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
        juris.acordaoLink = a_links[0].href;
        juris.andamentoslink = `https://pje.trt15.jus.br/consultaprocessual/detalhe-processo/${juris.processo}/2`;

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
  fs.writeFileSync('ato_discriminatorio_trt15_ate2017-2021.json', json);

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

jurisprudenciaTRT15();
