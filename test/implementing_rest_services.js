jest.unmock('../bin/implement_rest_services.js')
const original_args = process.argv.slice(0)

jest.unmock('../data/methods.json')
const methods = require('../data/methods.json')
jest.setMock('../source/normalize.js', jest.fn(_ => methods))

jest.unmock('fs')
const real_fs = require('fs')

process.argv = [
  'node',
  './path/to/script.js',
  `swagger=${__dirname}/../data/swagger.json`,
  `--interfaces=${__dirname}/../data/interfaces`,
  `implemenations=${__dirname}/../data/implemenations`
]

describe('implementing rest services', () => {
  it('should handle errors', () => {
    jest.setMock('fs', {
      mkdir: (_, cb) => cb(),
      readdir: (_, cb) => cb(new Error('test'))
    })
    expect(() => require('../bin/implement_rest_services.js')).toThrow()
  })
  it('should implement them', (done) => {
    var files_written = 0
    jest.setMock('fs', {
      mkdir: real_fs.mkdir,
      readdir: real_fs.readdir,
      readFile: real_fs.readFile,
      // writeFile: real_fs.writeFile
      writeFile: (path, file, cb) => {
        real_fs.readFile(path, (err, old_file) => {
          expect(file).toBe(old_file.toString())
          files_written++
          if (files_written === 2) {
            done()
          }
        })
      }
    })
    require('../bin/implement_rest_services.js')
  })
})
