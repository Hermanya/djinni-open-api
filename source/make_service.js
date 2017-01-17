const assert = require('assert')
const space = '    '
const get_type = require('./get_type.js')
const normalize = require('./normalize.js')
module.exports = function ({service_name, swagger, normalization}) {
  let interface_methods = normalize(swagger, normalization).map(function ({cpp_method_name, details, success_type, error_type}) {
    var response
    var response_doc
    if (success_type) {
      response = `callback: binary_lambda<optional<${success_type}>, optional<${error_type}>, void>`
      response_doc = `callback takes ${success_type} and ${error_type}, one of them is null`
    } else {
      response = `callback: unary_lambda<optional<${error_type}>, void>`
      response_doc = `callback takes nullable ${error_type}`
    }
    let params = (details.parameters || [])
      .map(p => `${p.name}: ${get_type(p)}`)
      .concat(response)
      assert(details.summary || details.description, 'summary or description is required for all params')
      let doc = [`\n${space}# ${(details.summary || details.description).replace(/a JSON payload/ig, 'an object')}`].concat((details.parameters || []).map(param => {
         return `# @param ${param.name} ${param.description}`
      })).concat([
         `# @param ${response_doc.replace('list<', 'list of ').replace('>', '')}`
      ]).join(`\n${space}`)
    return `${doc}\n${space}${cpp_method_name}(${params.join(', ')});`
  }).filter((_, index, all) => all.indexOf(_) === index)

  return `# Responsible for ${service_name} related REST calls
${service_name}Service = interface +c {${interface_methods.join(`\n`)}
}
`
}
