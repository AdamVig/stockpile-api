const restify = require('restify')
const restifyLinks = require('restify-links')

const auth = require('./controllers/auth')
const config = require('./package')
const filterRequestBody = require('./services/filter-request-body')
const options = require('./controllers/options')
const log = require('./services/log')

// Load environment variables, throw error if any variables are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

// Create application
const app = module.exports = restify.createServer({
  name: config.name,
  log,
  version: config.version
})

// Log every incoming request
app.pre(log.onRequest)

// Parse incoming request body and query parameters
app.use(restify.bodyParser({mapParams: false}))
app.use(restify.queryParser())

// Set name for links middleware
const links = restifyLinks()
Object.defineProperty(links, 'name', {value: 'links'})
app.use(links)

app.use(filterRequestBody())

// Handle OPTIONS requests and method not allowed errors
app.on('MethodNotAllowed', options.handle)

// Parse auth header
app.use(auth.initialize)

// Load all routes
require('./controllers/routes')(app)

// Check if application should start
if (!process.env.NO_START) {
  // Start application
  app.listen(process.env.PORT, log.onAppStart.bind(null, app))
}
