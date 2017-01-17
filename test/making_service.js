jest.unmock('../data/methods.json')
const methods = require('../data/methods.json')
jest.setMock('../source/normalize.js', jest.fn(_ => methods))

jest.unmock('../data/swagger.json')
const swagger = require('../data/swagger.json')

jest.setMock('../source/get_type.js', jest.fn(_ => _ && 'djinni_type'))

jest.unmock('../source/make_service.js')
const make_service = require('../source/make_service.js')

jest.unmock('fs')
const fs = require('fs')

describe('making records', () => {
  it('should make to records', () => {
    let old_service = fs.readFileSync('./data/djinni/PetStoreService.djinni')
    let service = make_service({
      service_name: 'PetStore',
      swagger: swagger
    })
    expect(service).toBe(old_service.toString())
  })
})
