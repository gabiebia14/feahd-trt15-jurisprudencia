'use strict';

const fs = require('fs');

let file1 = fs.readFileSync('entrega/ato_discriminatorio_trt15_2010-2016.json');
let file2 = fs.readFileSync('entrega/ato_discriminatorio_trt15_2017-2021.json');
let cont1 = JSON.parse(file1);
let cont2 = JSON.parse(file2);

let resultados = [];

resultados.push(...cont1);
resultados.push(...cont2);

let json = JSON.stringify(resultados, null, 2);
fs.writeFileSync('entrega/ato_discriminatorio_trt15.json', json);

//console.log(resultados);