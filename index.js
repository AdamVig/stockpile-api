const restify = require('restify')
const restifyJSONHAL = require('restify-json-hal')

const log = require('./services/log')
const config = require('./package')

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

// Handle CORS
app.use(restify.CORS())
app.opts(/.*/, (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods',
             req.header('Access-Control-Request-Method'))
  res.header('Access-Control-Allow-Headers',
             req.header('Access-Control-Request-Headers'))
  res.send(200)
  return next()
})

// Load all routes
require('./controllers/routes')(app)

// Start application
app.listen(process.env.PORT, () => {
  log.info('%s listening at %s', app.name, app.url)
})
