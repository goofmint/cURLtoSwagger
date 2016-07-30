_ = require 'underscore'
_.str = require 'underscore.string'
_.extend exports, require 'js-yaml'


MULTIDOC_TOKEN = '---\n'
MULTIDOC_DELIMITER = /\n*?\-{3}\n+/
YAML_HASH_TOKEN = /^\n*?[a-z0-9_]+\s*?: /
YAML_LIST_TOKEN = /^\n*?\- /


# gets rid of the ridiculous iterator interface to yaml.safeLoadAll
exports.safeIterate = exports.safeLoadAll
exports.safeLoadAll = (raw) ->
    data = []
    push = _.bind data.push, data
    exports.safeIterate raw, push
    data

exports.safeLoadAny = (raw) ->
    data = exports.safeLoadAll raw
    if isMultidoc raw
        data
    else
        data[0]

exports.isMultidoc = isMultidoc = (raw) ->
    _.str.startsWith raw, MULTIDOC_TOKEN

exports.isProbablyText = isProbablyText = (str) ->
    not (YAML_HASH_TOKEN.exec str) and not (YAML_LIST_TOKEN.exec str)

# a more flexible way to load mixed-format (data and text) documents 
# than just assuming frontmatter and a document, but at the same time
# more forgiving than yaml.safeLoadAll
exports.safeLoadMixed = (raw) ->
    if isMultidoc raw
        data = []
        for doc in (raw.split MULTIDOC_DELIMITER)[1..]
            if isProbablyText doc
                data.push doc
            else
                try
                    data.push exports.safeLoad doc
                catch err
                    if err instanceof exports.YAMLException
                        data.push doc
                    else
                        throw err
        data
    else
        exports.safeLoadAll raw
