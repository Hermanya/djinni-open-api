#!/usr/bin/env node

const args = process.argv.filter(_ => _.indexOf('=') > -1).reduce((args, _) => {
  if (!_.indexOf('--')) _ = _.slice(2)
  let [key, value] = _.split('=')
  try {
    args[key] = JSON.parse(value)
  } catch (e) {
    args[key] = value
  }
  return args
}, {})

const fs = require('fs')
const path = require('path')

const assert = require('assert')
assert(args.swagger, 'please specify --swagger=path/to/swagger.json')
const swagger = require(path.join(process.cwd(), args.swagger))
assert(args.interfaces, 'please specify --interfaces=path/to/djinni/generated/interfaces')
const input_dir = path.join(process.cwd(), args.interfaces)
assert(args.implemenations, 'please specify --implemenations=path/where/you/want/implemenations')
const output_dir = path.join(process.cwd(), args.implemenations)

if (args.special_method_names) {
  args.special_method_names = require(path.join(process.cwd(), args.special_method_names))
}

const space = '    '
const get_type = require('../source/get_type.js')
const normalize = require('../source/normalize.js')

function maybe_throw(error) {
  if (error) throw error
}

// deleteFolderRecursive(output_dir)
// function deleteFolderRecursive (path) {
//   var files = [];
//   if( fs.existsSync(path) ) {
//     files = fs.readdirSync(path);
//     files.forEach(function(file,index){
//       var curPath = path + "/" + file;
//       if(fs.lstatSync(curPath).isDirectory()) { // recurse
//         deleteFolderRecursive(curPath);
//       } else { // delete file
//         fs.unlinkSync(curPath);
//       }
//     });
//     fs.rmdirSync(path);
//   }
// }

fs.mkdir(output_dir, () => {
  fs.readdir(input_dir, index_input_dir)
})

function index_input_dir (error, files) {
  maybe_throw(error)
  files.filter(_ => _.indexOf('Service.hpp') !== -1).forEach(function (file_name) {
    fs.readFile(path.join(input_dir, file_name), (err, data) => {
      maybe_throw(err)
      handle_input_file(data.toString())
    });
  })
}

function handle_input_file (interface_header_file) {
  let class_name = interface_header_file.match(/class ([^\s\{]+)/)[1]
  fs.writeFile(`${output_dir}/${class_name}Impl.hpp`,
    implementation_header_file({interface_header_file, class_name}), maybe_throw);

  fs.writeFile(`${output_dir}/${class_name}Impl.cpp`, rest_implementation_file({interface_header_file, class_name}), maybe_throw)
}

function implementation_header_file ({class_name, interface_header_file}) {
  return interface_header_file.replace(new RegExp(class_name, 'g'),
                                       `${class_name}Impl`)
                              .replace('#pragma once', ['#pragma once', `#include "../interface/Error.hpp"`, `#include "../interface/${class_name}.hpp"`, '#include "../wrappers/HttpImpl.hpp"'].join("\n"))
                              .replace(`class ${class_name}Impl`,
                                       `class ${class_name}Impl: public ${class_name}`)
                              .replace(/virtual ~[^\n]+/, `${class_name}Impl(std::shared_ptr<HttpImpl> http_): _http(std::move(http_)){}`)
                              .replace(/=\s?0;/g, 'override;')
                              .replace('public:', `private:\n${space}std::shared_ptr<HttpImpl> _http;\npublic:`)
}

function rest_implementation_file ({interface_header_file, class_name}) {
  let implemenation_imports = [
    `#include "./${class_name}Impl.hpp"`,
    '#include "../wrappers/HttpImpl.hpp"',
    '#include <json11/json11.hpp>'
  ]
  return interface_header_file.replace(new RegExp(class_name, 'g'),
                                       `${class_name}Impl`)
                              .replace(/class[^}]+}/, '')
                              .replace(/};/, '')
                              .replace(/struct ([^;]+);/g, (_, struct) => {
                                implemenation_imports.push(`#include "../interface/${struct}.hpp"`)
                                return ''
                              })
                              .replace('#pragma once', implemenation_imports.join("\n"))
                              .replace(/\/\*\*[^\n]+\*\//, '')
                              .replace(/\n{2,}/g, "\n\n")
                              .replace(/\n\s+virtual\s+([^\s]+)\s+([^(]+)\(([^=]+) = 0;/g, (_, return_type, method_name, params) => {
                                let cpp_method = normalize(swagger, args).find(_ => _.cpp_method_name === method_name)
                                assert(cpp_method, `swagger does not mention ${method_name}: \n ${swagger}`)
                                let {success_type, error_type, method, path, details} = cpp_method
                                var callback = callback_implementation(success_type, error_type)

                                var maybeBody = (details.parameters || []).filter(_ => _.in === 'body').reduce((body, param) => {
                                  return body || `json_from_${get_type(param)}(${param.name}), `
                                }, '')

                                if (maybeBody === '' && ['post', 'put'].includes(method)) {
                                  maybeBody = '"", '
                                }

                                var path_replacements =  (details.parameters || []).filter(_ => _.in === 'path').map(param => {
                                  var cast = {
                                     'integer': '(int)'
                                  }[param.type] || ''
                                  return `path.replace(path.find("{${param.name}}"), ${param.name.length + 2}, json11::Json(${cast}${param.name}).dump());`
                                })

                                return `\n${return_type} ${class_name}Impl::${method_name} (${params} {
    std::string path = "${path}";${path_replacements.map(_ => `\n${space}${_}`).join('')}
    _http.get()->${method === 'delete' ? 'remove' : method}(${maybeBody}path, [callback] (HttpResponse resp) {
        ${callback}
    });
}`
                              })
}

function callback_implementation(success_type, error_type) {
  if (success_type && success_type.indexOf('list<') === 0) {
    return list_or_error(success_type, error_type)
  } else if (success_type) {
    return item_or_error(success_type, error_type)
  } else {
    return only_error(error_type)
  }
}

function list_or_error (success_type, error_type) {
  return `optional<${error_type}> maybeError;
        optional<std::vector${success_type.slice('list'.length)}> maybeResponse;
        if (resp.error) {
            maybeError = ${error_type}(resp.reason);
        } else {
            std::vector${success_type.slice('list'.length)} items;
            for (auto &item : resp.json.array_items()) {
                items.push_back(parsed_json_to_${success_type.slice('list<'.length, -1)}(item));
            }
            maybeResponse = items;
        }
        callback(maybeResponse, maybeError);`
}

function item_or_error (success_type, error_type) {
   return `optional<${error_type}> maybeError;
        optional<${success_type}> maybeResponse;
        if (resp.error) {
            maybeError = ${error_type}(resp.reason);
        } else {
            maybeResponse = parsed_json_to_${success_type}(resp.json);
        }
        callback(maybeResponse, maybeError);`
}

function only_error(error_type) {
  return `optional<${error_type}> maybeError;
        if (resp.error) {
            maybeError = ${error_type}(resp.reason);
        }
        callback(maybeError);`
}
