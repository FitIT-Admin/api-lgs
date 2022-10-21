

export interface EmailManager<T = Object> {
  getHTMLPasswordRecovery(fullname: String, token: String): string;
  getHTMLRegisterUserEmail(fullnameUser: String): string;
  getHTMLSureyAnswered(fullname: String, form: String, slug: String): string;
  getFromAddress(): string;
}

export class EmailService {
  constructor() { }

  getFromAddress() {
    return process.env.EMAIL_FROM_ADDRESS != undefined ? process.env.EMAIL_FROM_ADDRESS : "";
  }

  getHTMLPasswordRecovery(fullname: String, token: String): string {
    const template = './src/assets/email/recover-password.html';
    const jsdom = require('jsdom');
    const {JSDOM} = jsdom;
    const fs = require('fs');
    const contents = fs.readFileSync(template, 'utf8');
    const dom = new JSDOM(contents);
    const document = dom.window.document;
    document.querySelector('#name').innerHTML = fullname;
    document.querySelector('#token').href = process.env.FRONTEND_URL + "/auth/activate-password/" + token;
    return dom.serialize();
  }

  getHTMLRegisterUserEmail(fullnameUser: String): string {
    const template = './src/assets/email/register-account.html';
    const jsdom = require('jsdom');
    const {JSDOM} = jsdom;
    const fs = require('fs');
    const contents = fs.readFileSync(template, 'utf8');
    const dom = new JSDOM(contents);
    const document = dom.window.document;
    document.querySelector('#fullname').innerHTML = fullnameUser;
    document.querySelector('#url').href = process.env.FRONTEND_URL + "/activate-account";
    return dom.serialize();
  }

  getHTMLSureyAnswered(fullname: String, form: String, slug: String): string {
    const template = './src/assets/email/survey-answered.html';
    const jsdom = require('jsdom');
    const {JSDOM} = jsdom;
    const fs = require('fs');
    const contents = fs.readFileSync(template, 'utf8');
    const dom = new JSDOM(contents);
    const document = dom.window.document;
    document.querySelector('#fullname').innerHTML = fullname;
    document.querySelector('#form').innerHTML = form;
    document.querySelector('#url').href = process.env.FRONTEND_URL + "/admin/survey-history/view/" + slug;
    return dom.serialize();
  }
}

