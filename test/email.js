const proxyquire = require('proxyquire')
const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/email')

test.beforeEach(t => {
  const mailgunStub = {
    client: sinon.stub().callsFake(config => {
      if (!config.username || !config.key) {
        throw new Error('Missing username or API key')
      }
      return mailgunStub
    }),
    messages: {
      create: sinon.stub().callsFake((domain, data) => {
        return new Promise((resolve, reject) => {
          if (domain && data && data.from && data.to && data.replyTo && data.subject && data.inline && data.text &&
            data.html) {
            return resolve()
          } else {
            return reject(new Error('Attempted to create message with missing data'))
          }
        })
      })
    }
  }

  // Expose stub to test cases
  t.context.mg = mailgunStub

  // Create a fresh instance of the service for each test case
  t.context.email = proxyquire('../services/email', {'mailgun.js': mailgunStub})

  // Spy on service methods
  sinon.spy(t.context.email, 'sendMessage')
})

test('Create HTML email', t => {
  const email = t.context.email.createHtmlEmail(fixt.createHtmlEmail.content)
  t.truthy(email, 'generates email')
})
test('Create HTML email, no CTA', t => {
  const email = t.context.email.createHtmlEmail(fixt.createHtmlEmailNoCta.content)
  t.truthy(email, 'generates email')
})
test('Create text email', t => {
  const result = t.context.email.createTextEmail(fixt.createTextEmail.content)
  t.true(result === fixt.createTextEmail.expected, 'email is generated correctly')
})
test('Send message', async t => {
  await t.context.email.sendMessage(t.context.mg, fixt.sendMessage.sender, fixt.sendMessage.to,
    fixt.sendMessage.subject, fixt.sendMessage.content, fixt.sendMessage.replyTo)
  t.true(t.context.mg.messages.create.calledOnce, 'sends a message')
  t.false(t.context.mg.messages.create.threw(), 'does not throw an error')
})
test('Send', async t => {
  await t.context.email.send(fixt.send.to, fixt.send.subject, fixt.send.content)
  t.true(t.context.mg.client.calledOnce, 'creates a Mailgun client')
  t.true(t.context.email.sendMessage.calledOnce, 'sends a message')
})
