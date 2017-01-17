const get_type = require('./get_type.js')


function capitalize(x) {
  return x[0].toUpperCase() + x.slice(1)
}

module.exports = function (swagger, {special_method_names={}, path_prefix='/'}={}) {
  return Object.keys(swagger.paths).reduce((interface_methods, path) => {
    let calls = swagger.paths[path]
    Object.keys(calls)
      .filter(_ => _.indexOf('x-') !== 0)
      .filter(_ => !calls[_].deprecated)
      .forEach(http_method => {
        let target = path.split('/')
          .slice(path_prefix.split('/').length - 1)
          .filter(_ => _[0] !== '{') // {inlineParam}
          .filter(_ => _.indexOf('by') === -1) // byUsernameWithUsername
          .map(capitalize)
          .join('')
        let suffix = (calls[http_method].parameters || []).slice(0, 1).map(function (first_param) {
          return `With${capitalize(first_param.name)}`
        }).join('')
        let cpp_method_name = special_method_names[`${http_method}${path}`] || `${http_method}${target}${suffix}`
        let details = calls[http_method]
        let success_response = details.responses[200] || details.responses[201]
        var success_type
        if (success_response) {
          success_type = get_type(success_response)
          if ((success_response.schema && success_response.schema.type === 'array') ||
            (details.summary || '').toLowerCase().indexOf('returns all') !== -1) {
            success_type = `list<${success_type}>`
          }
        }

        let error_type = 'Error'// get_type(calls[http_method].responses['401'])

        interface_methods.push({
          cpp_method_name,
          method: http_method,
          path,
          success_type,
          error_type,
          details
        })
      })
    return interface_methods
  }, [])
}
