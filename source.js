var parse = require('parse-curl');
var $ = require('jquery');
var YAML = require('json2yaml');
var jsyaml = require('js-yaml');
$(function() {
  function changeRowCount() {
    if ($(".responses .row").length == 1) {
      $(".btn-delete").attr("disabled", true);
    }else{
      $(".btn-delete").attr("disabled", false);
    }
  }
  changeRowCount();
  $(".btn-add").on('click', function(e) {
    e.preventDefault();
    var div = $($(".responses .row")[0]).clone();
    div.find("input, textarea").val("");
    $(".responses").append(div);
    changeRowCount();
  })
  $(".responses").on('click', '.btn-delete', function(e) {
    e.preventDefault();
    $($(e.target).parents(".row")[0]).empty();
  });
  var options = {
    summary: "",
    description: ""
  };
  var words = options;
  
  if ($("#options").val() == "") {
    $("#options").val(YAML.stringify(options));
  }
  $("#yaml").on('focus', function(e) {
    e.target.select();
  });
  $("input,textarea").on('keyup', function(e) {
    var json = {};
    var str = $("#curl").val();
    var curl = parse(str);
    var options = $("#options").val();
    try {
      options = options != "" ? jsyaml.load(options) : {};
    }catch (e) {
      return;
    }
    words = options;
    curl.method = curl.method.toLowerCase();
    var url = new URL(curl.url);
    json[url.pathname] = {};
    json[url.pathname][curl.method] = {
      summary: options.summary || "",
      description: options.description || "",
    };
    var headers = curl.header;
    $.each(headers, function(name, value) {
      if ($("input[name='ignores[]'][value='"+name+"']").is(':checked')) {
        delete curl.header[name];
      }
    });
    // console.log(url);
    
    // Create request parameters
    parameters = [];
    $.each(convert_request(curl.header, 'header', words), function(i, params) {
      parameters.push(params);
    });
    if (curl.body) {
      $.each(convert_request(curl.body, 'form-data', words), function(i, params) {
        parameters.push(params);
      });
    }
    params = convert_parameters(url.search.substr(1).split('&'));
    $.each(convert_request(params, 'query', words), function(i, params) {
      if (params.name == "")
        return;
      parameters.push(params);
    });
    // console.log(parameters);
    json[url.pathname][curl.method].parameters = parameters;
    
    // Create response parameters
    $(".responses .row").each(function(i, dom) {
      var response_text = $(dom).find("textarea").val();
      var status_code   = $(dom).find("input").val();
      if (response_text == "" || status_code == "") {
        return;
      }
      response = JSON.parse(response_text);
      var properties = convert_response(response, words);
      response = {
        description: get_value(words, "response.description", ""),
        schema: {
          type: Array.isArray(response) ? 'array' : 'object'
        }
      }
      if (Array.isArray(response)) {
        response.schema.items = properties;
      } else {
        response.schema.properties = properties;
      }
      
      if (typeof json[url.pathname][curl.method].responses == 'undefined') {
        json[url.pathname][curl.method].responses = {};
      }
      json[url.pathname][curl.method].responses[status_code] = response;
    });
    if (!$("#options").is(":focus") && $("#options").val() !== YAML.stringify(words)) {
      $("#options").val(YAML.stringify(words));
    }
    $("#yaml").val(YAML.stringify(json).replace(/^\-\-\-/, ""));
  });
  
  function convert_parameters(params) {
    if (params.length == 0)
      return {};
    new_params = {};
    names = [];
    $.each(params, function(i, value) {
      values = value.split("=");
      key = decodeURI(values[0]);
      val = decodeURI(values[1]);
      if (m = key.match(/(.*?)\[.*?\]/)) {
        key = m[1];
      }
      if (names.indexOf(key) > -1) // Array
        return;
      new_params[key] = val;
    });
    return new_params;
  }
  
  function index(ary, value, list) {
    if (typeof list == 'undefined') {
      list = words;
    }
    if (ary.length == 1) {
      obj = list;
      if (typeof obj[ary[0]] == 'undefined' || obj[ary[0]] == null) {
        obj[ary[0]] = value;
      }
      return obj;
    }
    params = ary;
    for (i in params) {
      key = ary[i];
      if (typeof list[key] == 'undefined' || list[key] == null) {
        list[key] = {};
      }
      ary.shift();
      list[key] = index(ary, value, list[key]);
    }
    return list;
  }
  
  function get_value(options, place, default_value) {
    var ary = place.split(".");
    words = index(place.split("."), default_value);
    for (i in ary) {
      var key = ary[i];
      if (typeof options == 'undefined') {
        return default_value;
      }
      if (options == null) {
        return default_value;
      }
      if (typeof options[key] == 'undefined') {
        return default_value;
      }
      options = options[key];
    }
    return options;
  }
  
  function convert_request(params, place, options) {
    result = [];
    
    $.each(params, function(key, value) {
      if (Array.isArray(value) && typeof value[0] != 'object') {
        result.push({
          name: key,
          type: 'array',
          in: place,
          description: get_value(options, "parameters."+key+".description", ""),
          required: get_value(options, "parameters."+key+".required", true),
          items: {
            type: (typeof value[0])
          }
        });
      }else if (typeof value == 'object') {
        result.push({
          name: key,
          type: Array.isArray(value) == 'array' ? 'array' : 'object',
          in: place,
          description: get_value(options, "parameters."+key+".description", ""),
          required: get_value(options, "parameters."+key+".required", true),
          properties: convert_response(value)
        });
      } else {
        result.push({
          name: key,
          type: (typeof value),
          in: place,
          description: get_value(options, "parameters."+key+".description", ""),
          required: get_value(options, "parameters."+key+".required", true)
        })
      }
    });
    return result;
  }
  
  function convert_response(response, options, parent) {
    var result = {}
    if (typeof parent == 'undefined')
      parent = "";
    $.each(response, function(key, value) {
      if (value == null || typeof value == 'undefined') {
        value = "";
      }
      if (key == 'genres') {
        console.log(true)
      }
      if (Array.isArray(value) && (value[0] == null || typeof value[0] == 'undefined')) {
        value[0] = "";
      }
      if (isFinite(key)) {
         if (key === 0) {
           console.log(value);
         }
      }
      if (Array.isArray(value) && typeof value[0] != 'object') {
        result[key] = {
          type: 'array',
          items: {
            type: (typeof value[0]),
            description: get_value(options, "response."+parent+key+".description", ""),
          }
        };
      }else if (typeof value == 'object') {
        if (!isFinite(key))
          parent = parent == "" ? key + "." : parent + key + ".";
        if (Array.isArray(value)) {
          result[key] = {
            type: 'array',
            items: {
              type: 'object',
              properties: convert_response(merge_array(value), options, parent)
            }
          };
        }else{
          result[key] = {
            type: 'object',
            properties: convert_response(value, options, parent)
          };
        }
      } else {
        result[key] = {
          type: (typeof value),
          description: get_value(options, "response."+parent + key+".description", "")
        };
      }
    });
    return result;
  }
  
  function merge_array(array) {
    result = {};
    $.each(array, function(i, hash) {
      $.extend(result, hash);
    });
    return result;
  }
});
