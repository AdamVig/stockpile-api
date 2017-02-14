const restify = require('restify')
const restifyJSONHAL = require('restify-json-hal')

const auth = require('./controllers/auth')
const config = require('./package')
const log = require('./services/log')

// Load environment variables, throw error if any variables are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

// Create application
const app = module.exports = restify.createServer({
  name: config.name,
  log: log,
  version: config.version
})

// Log every incoming request
app.pre((req, res, next) => {
  req.log.info({req}, 'start')
  return next()
})

// Parse incoming request body and query parameters
app.use(restify.bodyParser({mapParams: false}))
app.use(restify.queryParser())

// Automatically add HATEAOS relations to responses
app.use(restifyJSONHAL(app, {
  overrideJSON: true,
  makeObjects: true
}))

// Parse auth header
app.use(auth.initialize)

// Load all routes
require('./controllers/routes')(app)

// Start application when not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(process.env.PORT, () => {
    log.info('%s listening at %s', app.name, app.url)
  })
}
