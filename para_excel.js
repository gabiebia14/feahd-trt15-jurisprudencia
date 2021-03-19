"use strict";

const fs = require("fs");
const { convertArrayToCSV } = require('convert-array-to-csv');
const converter = require('convert-array-to-csv');
 




  let file1 = fs.readFileSync("entrega_13_03_21/resultados_pesquisa_trt15.json");
  let juris = JSON.parse(file1);

  let contador = 0;
  let dados = [];

  for (var i in juris) {
    let proc = juris[i];
    contador += 1;
   //if (contador == 2) break;

    let numero = proc['processo'];
    let ano = proc['anoprocesso'];
    let publicacao = proc['datapublicacao'];
    let orgao = proc['orgaojulgador'];
    let relator = proc['relator'];
    let parcial = proc['textoparcial'];
    let acordao = proc['textoIntegral'];

    let mMax = -1;
    let mMin = -1;
    let textoMovimento = "";
    for (var j in proc.movimentos) {
      let mov = proc.movimentos[j];
      if (mMax == -1 || mMin == -1) {
        mMax = mov.data;
        mMin = mov.data;
      }

      if (mov.data > mMax) {
        mMax = mov.data;
      }

      if (mov.data < mMin) {
        mMin = mov.data;
      }

      textoMovimento += mov.data + " - " + mov.texto + '\n';
    }
    //dados.push([numero, ano, publicacao, orgao, relator, mMin, mMax, textoMovimento, parcial, acordao]);
    dados.push([numero, ano, publicacao, orgao, relator, mMin, mMax, parcial]);

  }

  //const header = ['numero', 'ano', 'publicacao', 'orgao', 'relator', 'data_primeiro_movimento', 'data_ultimo_movimento', 'movimentos', 'acordao_parcial', 'acordao_integral'];
  const header = ['numero', 'ano', 'publicacao', 'orgao', 'relator', 'data_primeiro_movimento', 'data_ultimo_movimento', 'acordao_parcial'];

  const csvFromArrayOfArrays = convertArrayToCSV(dados, {
    header,
    separator: ';'
  });

  console.log("abc");

  fs.writeFileSync("dados.csv", csvFromArrayOfArrays);


