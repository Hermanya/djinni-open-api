module.exports = function get_type (x) {
  if (!x) {
    return undefined
  }
  switch (x.type) {
    case 'array':
      if (!x.items.$ref) {
        // TODO: what is memberAssociations: {type: "array", items: {type: "object"}}
        return 'map<string, string>'
      }
      return `list<${x.items.$ref.split('/').pop()}>`
    case 'object':
      return `map<string, string>` // TODO: additionalProperties.type or $ref
    case 'string':
      return 'string' // TODO: handle dates and enums
    case 'integer':
      return 'i64'
    case 'boolean':
      return 'bool'
    case undefined:
      if (x.$ref) {
        return x.$ref.split('/').pop()
      } else if (x.schema) {
        if (x.schema.$ref) {
          return x.schema.$ref.split('/').pop()
        } else {
          return x.schema.items.$ref.split('/').pop()
        }
      } else {
        return undefined
      }
    default:
      return x.type
  }
}
