# Stockpile API Services
## Adding New Routes
All route logic is contained in controllers representing individual endpoints. Each controller should contain all of the relevant actions for an endpoint. Example controller:  
```JavaScript
// controllers/example.js
module.exports.get = (req, res, next) => {
  try {
    res.send('example')
  } catch (err) {
    next(err)
  }
}
```

Controller exports should be named for what they *do* not what HTTP verb they will be associated with. For example, use `module.exports.update` instead of `module.exports.put`.  


Routes are defined in `./controllers/routes.js`. Example of defining a route:  
```JavaScript
// controllers/routes.js
const example = require('./example')

module.exports = (app) => {
  app.get({name: 'get example', path: '/example'}, example.get)
}
```

Each route *must* have a descriptive, unique `name` property. Route names are used in defining relations, which show up in the `_links` property of responses. Restify removes spaces, special characters, and uppercase letters from route names, so there is no need to camelcase or kebab-case them.  

