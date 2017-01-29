# stockpile-api
The API for Stockpile, an app that manages stuff for organizations.  

See [stockpile-app](https://github.com/emmanuelroussel/stockpile-app) for the web and mobile application that consumes this API.  

## Scripts
Yarn presents the same API as npm for running scripts. The scripts below are defined in `package.json`.  
 * `yarn start` start the app in production
 * `yarn stop` stop the app in production
 * `yarn test` test code using [Ava](https://github.com/avajs/ava)
 * `yarn run dev` run the app in development
 * `yarn run lint` lint code using [ESLint](http://eslint.org/) + [StandardJS](http://standardjs.com/)
 * `yarn run docs` generate documentation using [Docco](https://jashkenas.github.io/docco/)

## Environment Variables
You must define environment variables in a `.env` file in the root directory of the project. Use `.env.example` as a template. The app will fail to start if any of the variables in `.env.example` are undefined.  
Environment variables are loaded into the app and can be accessed in any file with `process.env.VAR_NAME`.  
Override variables at run-time by defining them with the command, like `VAR_NAME=value yarn start`.  

## Tests
Tests are located in `./test` and are run asynchronously in parallel with `yarn test`.  

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


Routes are defined in `./controllers/routes.js`. Example of defining a route:  
```JavaScript
// controllers/routes.js
const example require('../example')

module.exports = (app) => {
  app.get('/example', example.get)
}
```
