jest.setMock('../source/get_type.js', jest.fn(_ => _ && 'djinni_type'))
jest.unmock('../source/normalize.js')
const normalize = require('../source/normalize.js')
jest.unmock('../data/swagger.json')
const swagger = require('../data/swagger.json')
jest.unmock('../data/methods.json')
const methods = require('../data/methods.json')
describe('normalize', () => {
  it('should map swagger to more convenient json', () => {
    let json = (_) => JSON.stringify(_, undefined, 2)
    expect(json(normalize(swagger, {
      path_prefix: '/rest/{version}/'
    }))).toBe(json(methods))
  })
})
