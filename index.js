const corsMiddleware = require('restify-cors-middleware')
const restify = require('restify')
const restifyLinks = require('restify-links')

const auth = require('./controllers/auth')
const config = require('./package')
const filterRequestBody = require('./services/filter-request-body')
const log = require('./services/log')

// Load environment variables, throw error if any variables are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

// Create application
const app = module.exports = restify.createServer({
  name: config.name,
  log,
  // Default versions for routes without explicit version set; should contain all past major versions
  version: [
    '1.0.0',
    '2.0.0',
    config.version
  ]
})

// Assign a unique request ID to each request
app.use(restify.plugins.requestLogger())

// Parse incoming request body and query parameters
app.use(restify.plugins.bodyParser())
app.use(restify.plugins.queryParser({mapParams: true}))

// Set name for links middleware
const links = restifyLinks()
Object.defineProperty(links, 'name', {value: 'links'})
app.use(links)

app.use(filterRequestBody())

// Log incoming requests
app.use(log.onRequest)

// Parse auth header
app.use(auth.initialize)

// Log errors
app.on('restifyError', log.onError)
app.on('uncaughtException', log.onError)

// Log outgoing responses
app.on('after', log.onResponse)

// Handle CORS
const cors = corsMiddleware({
  origins: [
    'http://localhost:8080' // origin of WKWebView on iOS
  ],
  allowHeaders: [
    'accept',
    'accept-version',
    'authorization',
    'content-type',
    'request-id',
    'origin'
  ]
})
app.pre(cors.preflight)
app.use(cors.actual)

// Load all routes
require('./controllers/routes')(app)

// Check if application should start
if (!process.env.NO_START) {
  // Start application
  app.listen(process.env.PORT, log.onAppStart.bind(null, app))
}
