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
    // console.log(curl);
    var options = $("#options").val();
    try {
      options = options != "" ? jsyaml.load(options) : {};
    }catch (e) {
      return;
    }
    curl.method = curl.method.toLowerCase();
    var url = new URL(curl.url);
    json[url.pathname] = {};
    json[url.pathname][curl.method] = {
      summary: options.summary || "",
      description: options.description || "",
    };
    var headers = curl.header;
    $.each(headers, function(name, value) {
      console.log(name, $("input[name='ignores[]'][value='"+name+"']").is(':checked'))
      if ($("input[name='ignores[]'][value='"+name+"']").is(':checked')) {
        delete curl.header[name];
      }
    });
    // console.log(url);
    
    // Create request parameters
    parameters = [];
    $.each(convert_request(curl.header, 'header', options), function(i, params) {
      parameters.push(params);
    });
    params = convert_parameters(url.search.substr(1).split('&'));
    $.each(convert_request(new_params, 'query', options), function(i, params) {
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
      var properties = convert_response(response, options);
      response = {
        description: get_value(options, "response.description", ""),
        schema: {
          type: Array.isArray(response) ? 'array' : 'object',
          properties: properties
        }
      }
      if (typeof json[url.pathname][curl.method].responses == 'undefined') {
        json[url.pathname][curl.method].responses = {};
      }
      json[url.pathname][curl.method].responses[status_code] = response;
    });
    $("#yaml").val(YAML.stringify(json));
  });
  
  function convert_parameters(params) {
    new_params = {};
    names = [];
    $.each(params, function(i, value) {
      values = value.split("=");
      key = decodeURI(values[0]);
      val = decodeURI(values[1]);
      if (m = key.match(/(.*?)\[.*?\]/)) {
        console.log(m)
        key = m[1];
      }
      if (names.indexOf(key) > -1) // Array
        return;
      new_params[key] = val;
    });
    return new_params;
  }
  
  function get_value(options, place, default_value) {
    var ary = place.split(".");
    for (i in ary) {
      var key = ary[i];
      if (options[key] == null)
        return default_value;
      if (typeof options[key] == 'undefined')
        return default_value;
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
          description: get_value(options, "request."+place+"."+key+".description", ""),
          required: get_value(options, "request."+place+"."+key+".required", true),
          items: {
            type: (typeof value[0])
          }
        });
      }else if (typeof value == 'object') {
        result.push({
          name: key,
          type: Array.isArray(value) == 'array' ? 'array' : 'object',
          in: place,
          description: get_value(options, "request."+place+"."+key+".description", ""),
          required: get_value(options, "request."+place+"."+key+".required", true),
          items: {
            properties: convert_response(value)
          }
        });
      } else {
        result.push({
          name: key,
          type: (typeof value),
          in: place,
          description: get_value(options, "request."+place+"."+key+".description", ""),
          required: get_value(options, "request."+place+"."+key+".required", true)
        })
      }
    });
    return result;
  }
  
  function convert_response(response, options) {
    var result = {}
    $.each(response, function(key, value) {
      if (Array.isArray(value) && typeof value[0] != 'object') {
        result[key] = {
          type: 'array',
          items: {
            type: (typeof value[0]),
            description: get_value(options, "response."+key+".description", ""),
          }
        };
      }else if (typeof value == 'object') {
        result[key] = {
          type: Array.isArray(value) ? 'array' : 'object',
          items: {
            properties: convert_response(value, options)
          }
        };
      } else {
        result[key] = {
          type: (typeof value),
          description: get_value(options, "response."+key+".description", "")
        };
      }
    });
    return result;
  }
});
