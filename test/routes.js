const test = require('ava')

// Do not start application when importing it
process.env.NO_START = true
const app = require('../index')

test('Routes are defined correctly', t => {
  const methods = Object.keys(app.router.routes)
  methods.forEach(method => {
    app.router.routes[method].forEach(route => {
      t.truthy(route.name, 'route has name')
      t.truthy(route.spec.path, 'route has path')
    })
  })
})
