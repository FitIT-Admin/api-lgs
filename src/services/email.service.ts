

import * as nodemailer from 'nodemailer';

export interface EmailConfiguration {
  type: string,
  host: string,
  secure: boolean,
  port: number,
  tls: {
    rejectUnauthorized: boolean
  },
  auth: {
    user: string,
    pass: string
  }
}

export interface EmailParamater {
  to: string,
  from: string,
  subject: string,
  html: string
}

export interface EmailManager<T = Object> {
  sendMail(mailObj: EmailParamater): Promise<T>;
  getHTMLPasswordRecovery(fullname: String, token: String): string;
  getHTMLRegisterUserEmail(fullnameUser: String): string;
  getHTMLSureyAnswered(fullname: String, form: String, slug: String): string;
  getFromAddress(): string;
}

export class EmailService {
  constructor() { }

  async sendMail(mailObj: EmailParamater): Promise<object> {
    let transporter;
    transporter = nodemailer.createTransport(this.getSMTPLocalConfig());
    return await transporter.sendMail(mailObj);
  }

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
    document.querySelector('#token').href = process.env.FRONTEND_URL + "/activate/password/" + token;
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



  /** mailjet */
  private getSMTPLocalConfig(): EmailConfiguration {
    return {
      type: "smtp",
      host: process.env.EMAIL_SMTP_SERVER != undefined ? process.env.EMAIL_SMTP_SERVER : "",
      secure: true,
      port: process.env.EMAIL_SMTP_PORT != undefined ? Number.parseInt(process.env.EMAIL_SMTP_PORT) : 25,
      tls: {
        rejectUnauthorized: false
      },
      auth: {
        user: process.env.EMAIL_SMTP_USER != undefined ? process.env.EMAIL_SMTP_USER : "",
        pass: process.env.EMAIL_SMTP_PASS != undefined ? process.env.EMAIL_SMTP_PASS : ""
      }
    }
  }

  private getSMTPOffice365Config(): EmailConfiguration {
    return {
      type: "smtp",
      host: process.env.EMAIL_SMTP_SERVER != undefined ? process.env.EMAIL_SMTP_SERVER : "",
      secure: false,
      port: process.env.EMAIL_SMTP_PORT != undefined ? Number.parseInt(process.env.EMAIL_SMTP_PORT) : 25,
      tls: {
        rejectUnauthorized: false
      },
      auth: {
        user: process.env.EMAIL_SMTP_USER != undefined ? process.env.EMAIL_SMTP_USER : "",
        pass: process.env.EMAIL_SMTP_PASS != undefined ? process.env.EMAIL_SMTP_PASS : ""
      }
    }
  }
}

