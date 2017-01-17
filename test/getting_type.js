jest.unmock('../source/get_type.js')
const get_type = require('../source/get_type.js')
describe('get_type', () => {
  it('should map types', () => {
    expect(get_type()).toBe(undefined)

    expect(get_type({
      "type": "array",
      "items": {
        "$ref": "#/definitions/Product"
      }
    })).toBe('list<Product>')

    expect(get_type({
      "$ref": "#/definitions/Product"
    })).toBe('Product')

    expect(get_type({
      type: "array",
      items: {type: "object"}
    })).toBe('map<string, string>')

    expect(get_type({
      "schema": {"items": {"$ref": "#/definitions/Product"}}
    })).toBe('Product')

    expect(get_type({
      "type": "number",
      "format": "double"
    })).toBe('number')

    expect(get_type({
      "type": "number",
      "format": "double"
    })).toBe('number')

    expect(get_type({
      "type": "integer",
      "format": "int32"
    })).toBe('i64')

    expect(get_type({
      "schema": {
        "$ref": "#/definitions/Error"
      }
    })).toBe('Error')

    expect(get_type({
      "type": "string"
    })).toBe('string')

    expect(get_type({
      "type": "boolean"
    })).toBe('bool')

    expect(get_type({})).toBe(undefined)

    expect(get_type({
      "type": "object"
    })).toBe('map<string, string>')
  })
})
