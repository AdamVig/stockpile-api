/**
 * Send email
 *
 * @module services/email
 */

const mailgun = require('mailgun.js')
const fs = require('fs')
const path = require('path')

// Load environment variables, throw error if any variables are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

/**
 * Create an HTML email
 * @param {object} content Content for body of email
 * @param {string} content.title Title of email, only visible in preview
 * @param {string} content.body Body of email; use blank lines to separate paragraphs
 * @param {string} [content.cta] Call to action text for button
 * @param {string} [content.link] Link for button to go to
 */
module.exports.createHtmlEmail = ({title, body, cta, link}) => {
  let emailTemplate = fs.readFileSync(path.join(__dirname, '../email') + '/email-template.html', 'utf8')
  emailTemplate = emailTemplate.replace('{{title}}', title)

  // Build body with separate paragraphs for each blank line
  const style = 'style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; Margin-bottom: 15px;"'
  let htmlBody = ''
  for (const paragraph of body.split(/(\r\r)?(\n\n)/)) {
    if (paragraph && paragraph.trim()) {
      htmlBody += `<p ${style}>${paragraph.trim()}</p>\r\n`
    }
  }

  emailTemplate = emailTemplate.replace('{{body}}', htmlBody)

  // Add action to email if CTA and link are provided
  if (cta && link) {
    let ctaTemplate = fs.readFileSync(path.join(__dirname, '../email') + '/cta-template.html', 'utf8')
    ctaTemplate = ctaTemplate.replace('{{cta}}', cta)
    ctaTemplate = ctaTemplate.replace('{{link}}', link)
    emailTemplate = emailTemplate.replace('{{action}}', ctaTemplate)

  // Remove action placeholder
  } else {
    emailTemplate = emailTemplate.replace('{{action}}', '')
  }
  return emailTemplate
}

/**
 * Create a text email
 * @param {object} content Content for body of email
 * @param {string} content.title Title of email
 * @param {string} content.body Body of email; use blank lines to separate paragraphs
 * @param {string} [content.cta] Call to action text
 * @param {string} [content.link] Link to display after call to action
 */
module.exports.createTextEmail = ({title, body, cta, link}) => {
  return `${title}

${body}

${cta}
${link}
`
}

/**
 * Send an email using the Mailgun API
 * @param {object} mg Mailgun client
 * @param {string} sender Email address to send the email from
 * @param {string} to Email address to send the email to
 * @param {string} subject Subject of email
 * @param {object} content Content for body of email
 * @param {string} content.title Title of email, only visible in preview
 * @param {string} content.body Body of email; use blank lines to separate paragraphs
 * @param {string} [content.cta] Call to action text for button
 * @param {string} [content.link] Link for button to go to
 * @param {string} [replyTo] Email address that recipients should reply to
 * @return {Promise.<object>} Resolved with response from API, rejected with error from API
 */
module.exports.sendMessage = (mg, sender, to, subject, content, replyTo) => {
  const logo = fs.createReadStream(path.join(__dirname, '../email') + '/stockpile-lockup-horizontal-1024.png')
  const data = {
    from: sender,
    to,
    replyTo,
    subject,
    inline: [logo],
    text: module.exports.createTextEmail(content),
    html: module.exports.createHtmlEmail(content)
  }
  const domain = 'mail.stockpileapp.co'
  return mg.messages.create(domain, data)
}

/**
 * Send an email
 * @param {string} to Email address to send the email to
 * @param {string} subject Subject of email
 * @param {object} content Content for body of email
 * @param {string} content.title Title of email, only visible in preview
 * @param {string} content.body Body of email; use blank lines to separate paragraphs
 * @param {string} [content.cta] Call to action text for button
 * @param {string} [content.link] Link for button to go to
 * @return {Promise} Resolved by `undefined`, rejected with status code of failed Mailgun API call
 */
module.exports.send = (to, subject, content) => {
  const sender = 'Stockpile <noreply@stockpileapp.co>'
  const replyTo = 'Stockpile <info@stockpileapp.co>'
  const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_KEY})
  return module.exports.sendMessage(mg, sender, to, subject, content, replyTo)
}
