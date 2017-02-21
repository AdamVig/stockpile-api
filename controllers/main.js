const main = module.exports = {}

main.mount = app => {
  app.get({name: 'main', path: '/'}, main.get)
}

main.get = (req, res, next) => {
  res.send({})
}
