
import {MySurveys, Form} from '../models';
import * as fs from 'fs';
const puppeteer = require('puppeteer');
import { writeFile } from 'fs';

/**
 * Creates html text for product details view
 * @param product The product that you want to create a pdf
 */
export async function buildPdfText(mySurvey: MySurveys, form : Form): Promise<string> {
    const description = form.description
    ? ` <div class="fw6 mb2">Descripción</div><p class="ml-2 fs14">${form.description}</p>`
    : '';

    const relation = form.group ? 'Grupo' : 'Orden de Trabajo'
    const group =  form.group ? `<li class="lide"> <span class="fw6">Grupo</span> ${form.group} </li>` : ''; 
    const ot = form.ot ? `<li class="lide"> <span class="fw6">Orden de Trabajo</span> ${form.ot} </li>` : ''; 
    const status = form.status === 1 ? 'Aprobado' :  form.status === 2 ? 'Suspendido' : 'Eliminado'; 
    const vigency = form.vigencyAt?.toDateString().substring(0, 9) === '5000-01-01' ? 'Indefinida' : 'Definida';

   
    const answers = mySurvey.questions
    ? mySurvey.questions
        .map(question => {
        let selected = question.answer.filter( (ans: any) => {
            return ans.selected;
        });

          if(question.tipo == "multiple"){  
              if(selected[0]){
          return `<li class="lide"><b>${question.title}</b><br>${selected[0].value}</li>`;
              }
          } else if (question.tipo == "mixta") {
               if(selected.length > 0){
                    let respuesta : any;
                    respuesta = `<li class="lide"><b>${question.title}</b><br>`;
                    for (let i=0; i < selected.length; i++){
                        respuesta += `${selected[i].value}<br>`;
                    }
                    respuesta += `</li>`;

                    return respuesta;
               }

          }else if (question.tipo == "abierta") {
            if(selected[0]){
              return `<li class="lide"><b>${question.title}</b><br>${selected[0].selected}</li>`;
            }
          }else if (question.tipo == "menu") {
            if(selected[0]){
                return `<li class="lide"><b>${question.title}</b><br>${selected[0].value}</li>`;
            }
          }else if (question.tipo == "subir") {
            if(selected[0]){
            let uri = process.env.BACKEND_URL+"/uploads/"+selected[0].selected;
                return `<li class="lide"><b>${question.title}</b><br><img src="${uri}" alt="${uri}" ></img></li>`;
            }
          }
   
        })
        .join('\n')
    : '';
    const questions = mySurvey.questions && mySurvey.questions.length > 0
      ? `<div class="fw6 mb2">Preguntas</div>
            <ul>
              ${answers}
            </ul>
`
      : `<br><br>`;
  return `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <style>
        body{
            font-family: "Titillium Web", sans-serif;
        }
        .ul-de{
            list-style: none;
            font-size: 18px;
            display: block;
            padding: 0;
            margin: 0;
        }

        .lide{
            margin-right:20px;
            margin-top:10px;
        }
        .fw6{
            font-weight:bold;
        }
        .ml-2{
            margin-left:20px;
        }
        .m2{
            margin:10px 0px 10px 0px;
        }
        .fs14{
            font-size:14px;
        }
        .mb2{
            margin-bottom:20px;
        }
        .small {
            font-size: 0.5em;
        }
        .button{
          padding:10px 0px 10px 0px
        }

        @font-face {
              font-family: "Titillium Web";
              font-style: normal;
              font-weight: 300;
              font-display: swap;
              src: local("Titillium Web Light"), local("TitilliumWeb-Light"), url(https://fonts.gstatic.com/s/titilliumweb/v8/NaPDcZTIAOhVxoMyOr9n_E7ffGjEGIVzY5abuWIGxA.woff2) format("woff2");
              unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
          }

          @font-face {
              font-family: "Titillium Web";
              font-style: normal;
              font-weight: 300;
              font-display: swap;
              src: local("Titillium Web Light"), local("TitilliumWeb-Light"), url(https://fonts.gstatic.com/s/titilliumweb/v8/NaPDcZTIAOhVxoMyOr9n_E7ffGjEGItzY5abuWI.woff2) format("woff2");
              unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
          }

          @font-face {
              font-family: "Titillium Web";
              font-style: normal;
              font-weight: 400;
              font-display: swap;
              src: local("Titillium Web Regular"), local("TitilliumWeb-Regular"), url(https://fonts.gstatic.com/s/titilliumweb/v8/NaPecZTIAOhVxoMyOr9n_E7fdM3mDaZRbryhsA.woff2) format("woff2");
              unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
          }

          @font-face {
              font-family: "Titillium Web";
              font-style: normal;
              font-weight: 400;
              font-display: swap;
              src: local("Titillium Web Regular"), local("TitilliumWeb-Regular"), url(https://fonts.gstatic.com/s/titilliumweb/v8/NaPecZTIAOhVxoMyOr9n_E7fdMPmDaZRbrw.woff2) format("woff2");
              unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
          }

          @font-face {
              font-family: "Titillium Web";
              font-style: normal;
              font-weight: 600;
              font-display: swap;
              src: local("Titillium Web SemiBold"), local("TitilliumWeb-SemiBold"), url(https://fonts.gstatic.com/s/titilliumweb/v8/NaPDcZTIAOhVxoMyOr9n_E7ffBzCGIVzY5abuWIGxA.woff2) format("woff2");
              unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
          }

          @font-face {
              font-family: "Titillium Web";
              font-style: normal;
              font-weight: 600;
              font-display: swap;
              src: local("Titillium Web SemiBold"), local("TitilliumWeb-SemiBold"), url(https://fonts.gstatic.com/s/titilliumweb/v8/NaPDcZTIAOhVxoMyOr9n_E7ffBzCGItzY5abuWI.woff2) format("woff2");
              unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
          }

          @font-face {
              font-family: "Titillium Web";
              font-style: normal;
              font-weight: 700;
              font-display: swap;
              src: local("Titillium Web Bold"), local("TitilliumWeb-Bold"), url(https://fonts.gstatic.com/s/titilliumweb/v8/NaPDcZTIAOhVxoMyOr9n_E7ffHjDGIVzY5abuWIGxA.woff2) format("woff2");
              unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
          }

          @font-face {
              font-family: "Titillium Web";
              font-style: normal;
              font-weight: 700;
              font-display: swap;
              src: local("Titillium Web Bold"), local("TitilliumWeb-Bold"), url(https://fonts.gstatic.com/s/titilliumweb/v8/NaPDcZTIAOhVxoMyOr9n_E7ffHjDGItzY5abuWI.woff2) format("woff2");
              unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
          }

    </style>

    </head>
    <body>
    <h1 style="color:#f3494a;text-align:center;">` + form.title + `</h1>
    ${description}
    <ul class="ul-de">
        <li class="lide">
            <span class="fw6">Fecha</span> ` + form.publishAt + `
        </li>
        <li class="lide">
            <span class="fw6">Relación</span> ` + relation + `
        </li>
        ${group}
        ${ot}
        <li class="lide">
            <span class="fw6">Estado</span> ` + status + `
        </li>
        <li class="lide">
            <span class="fw6">Vigencia</span> ` + vigency + `
        </li>
        <li class="lide">
            <span class="fw6">Fecha de Vigencia</span> ` + form.vigencyAt + `
        </li>
        <li class="lide">
            <span class="fw6">Cliente Empresa</span> ` + form.customer + `
        </li>
        <li class="lide">
            <span class="fw6">Fecha de envío</span> ` + mySurvey.confirmatedAt + `
        </li>
    </ul>
    <hr>
    ${questions}
    </body>
    </html>`;
}

/**
 * Saves pdf to local
 * @param product The product that you want to create a pdf
 */
export async function savePdf(mySurvey: MySurveys, form : Form, nameFile : string): Promise<string> {
  try {
    let html = await buildPdfText(mySurvey, form);
    fs.writeFileSync(`./${nameFile}.html`, html);
    return '1';
  } catch (ex) {
    console.log(ex);
    return '';
  }
}
/**
 * It creates html and pdf from the created html, then it uploads
 * the pdf and returns a pdf link for global access.
 * @param product The product that you want to create a pdf
 */
export async function createMySurveyPdf(mySurvey: MySurveys, form : Form, nameFile : string): Promise<string> {
  return new Promise(async function(resolve, reject) {
    await savePdf(mySurvey, form, nameFile);
    puppeteer
      .launch({
        executablePath: process.env.CHROME_BIN || null,
        args: [
          '--no-sandbox',
          '--headless',
          '--disable-gpu',
          '--disable-dev-shm-usage',
        ],
      })
      .then(
        // tslint:disable-next-line: no-any
        async (browser: any) => {
          try {
            const page = await browser.newPage();
            console.log('PDF - Creating HTML');
            const html = fs.readFileSync(`./${nameFile}.html`, 'utf8');
            console.log('PDF - Generated HTML');
            console.log('PDF - Setting HTML on PDF');
            
            await page.setContent(html, {
              waitUntil: 'networkidle2',
            });
            
            //await page.emulateMedia('screen');
            console.log('PDF - Generated HTML on PDF');
            console.log('PDF - Creating PDF');
            
            await page.pdf({
              format: 'A4',
              margin: {
                top: '40px',
                bottom: '40px',
                left: '20px',
                right: '20px',
              },
              path: `./${nameFile}.pdf`.replace('/dist/lib', ''),
            });
            await browser.close();
            console.log('PDF - Generated OK');
            resolve(
              fs.readFileSync('./' + nameFile + '.pdf', {
                encoding: 'base64',
              }),
            );
          } catch (ex) {
            console.log(ex);
            reject(ex);
          }
        },
      );
  });
}
