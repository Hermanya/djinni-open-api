const space = '    '
const get_type = require('./get_type.js')

module.exports = function (swagger) {
  let {definitions} = swagger
  return Object.keys(definitions).filter(_ => definitions[_].properties).map(def_name => {
    let def = definitions[def_name].properties
    let fields = Object.keys(def).filter(_ => _ !== 'description').map(field_name => {
      if (/Dto/.test(def_name)) {
        return `${field_name}: optional<${get_type(def[field_name])}>;`
      } else {
        return `${field_name}: ${get_type(def[field_name])};`
      }
    })
    return `${def_name} = record {\n${space}${fields.join(`\n${space}`)}\n} deriving (json)\n`
  }).join("\n")
}
