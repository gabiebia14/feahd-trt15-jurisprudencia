'use strict';

const fs = require('fs');

let file1 = fs.readFileSync('entrega/ato_discriminatorio_trt15.json');
let juris = JSON.parse(file1);


console.log(juris.length);
