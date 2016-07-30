# A YAML parser for text documents

[![Build Status](https://travis-ci.org/stdbrouw/yaml2json.svg)](https://travis-ci.org/stdbrouw/yaml2json)

There's no dearth of YAML parsers and YAML to JSON converters. This command-line utility was built to handle YAML files that contain multiple documents, data and text mixed together. It's great for working with the frontmatter-plus-content format that static site generators almost universally depend on.

Install with `npm install yaml-to-json -g`.

Basic usage is simply `yaml2json <file ...>`. It is also possible to convert an entire directory (and its subdirectories) at once, using `yaml2json <directory> --output <destination>`.

For an overview of all available command-line flags, use `yaml2json --help` or read on!

### Text detection

A regular YAML parser will try to parse almost everything it humanly can into objects and arrays. For example, a text document that starts with "That is to say: an example." will be interpreted as a `That is to say` key with `an example.` as its value.

`yaml2json` solves this through fussy parsing: add the `--fussy` flag to ask the parser to only interpret something as an object or a string, rather than plain text, if it really unambigously looks like it: 

* object: `author: George Brassens`
* string: `Here's an artist you might like: George Brassens`
* string: `Witty: that's how I'd describe him.`
* array: `- don't forget to bring milk`
* string: ` - here's an anecdote`
* string: `-- anyway, that's the end of it`

If fussy parsing is activated, object keys can only be single-word lowercase alphanumeric characters or the underscore (`[a-z0-9_]`) and lists have to start with `- `, without any leading indentation.

Fussy parsing is recommended when working with text-heavy YAML multi-documents. It guarantees your content won't accidentally get interpreted as YAML, but any frontmatter will be parsed as data just fine.

### Markup languages

`yaml2json` can optionally run strings through a Markdown, Textile or AsciiDoc converter, replacing those strings with the rendered HTML.

To convert only string documents in a multidoc, use `--convert`. To convert _any_ string, even those in objects and arrays, instead use `--convert-all`. (Do you put your document's title and summary in YAML frontmatter, and would you like to be able to use bold and italics for said title and summary? Then `--convert-all` is for you.)

If you'd like to keep the raw markup in addition to the HTML output from the parser, use the `--keep-raw` flag. Your string will be replaced by an object with two keys: 

* `html`
* `markdown`, `asciidoc` or `textile` keys depending on your markup language

Please note that Asciidoc conversion can be a bit flaky. The [Asciidoctor.js](http://asciidoctor.org/docs/install-and-use-asciidoctorjs/) module for converting Asciidoc in JavaScript applications is still rather immature.

### Pretty output for prose documents

A multidoc is an array of documents, and that's what `yaml2json` will print out:

```json
[
    {
        "title": "...", 
        "author": "..."
    }, 
    {
        "markdown": "...", 
        "html": "...", 
    }
]
```

However, for simple documents that consist of just YAML frontmatter plus content, a prettier output format is supported, which merges metadata (such as title and author) and content: 

```json
{
    "html": "...", 
    "markdown": "...", 
    "title": "...", 
    "author": "..."
}
```

Documents beyond the frontmatter and content, if any, will be added to an array accessible under `more`.

Use the `--prose` flag to change output to this cleaner format. Note that this flag automatically enables `--convert`, `--fussy` and `--keep-raw` as well. 

### Use from node.js

```javascript
/* high-level interface */
var yaml2json = require('yaml-to-json');
yaml2json(str, options);

/* lower-level interface */
var yaml = require('yaml-to-json').yaml;
// load multiple documents, always returns an array
yaml.safeLoadAll(str);
// load one or more documents, returning 
// an array or an object depending on whether
// a multidoc is detected
yaml.safeLoadAny(str);
// fussy parsing (prefers to parse documents 
// as strings rather than as YAML)
yaml.safeLoadMixed(str);
// detect if a string of YAML contains multiple documents
yaml.isMultidoc(str);
```

`yaml2json` is actually a bit of a misnomer in the context of node.js: the output of the function will be JavaScript objects, not a serialized string of JSON.

The options to the `yaml2json` function are camelCased versions of the command-line otions: `convertAll`, `human`, `keepRaw` et cetera.

Take a look at the test suite for more example code.

### Some thoughts about mixed-format YAML

The frontmatter-plus-content format is an elegant way to structure blog posts and other simple documents. But it's not the only way. The great thing about mixed-format YAML files is that you can mix up however many text and metadata blocks as you'd like.

How about this for a wiki page:

```yaml
---
block: metadata
title: The Music Man
year: 1962
---
In July 1912, a traveling salesman, "Professor" Harold Hill (Robert Preston), arrives in the fictional location of River City, Iowa, intrigued by the challenge of swindling the famously stubborn natives of Iowa.
---
block: cast
actors:
    - Robert Preston
    - Shirley Jones
---
In 2005, The Music Man was selected for preservation in the United States National Film Registry by the Library of Congress as being "culturally, historically, or aesthetically significant".
---
block: disambiguation
alternatives:
    - The Music Man (2003 film)
    - Music Man (company), a guitar company
    - The Music Man is the English name for the Iranian film Santouri (film)
```

When toying around with formats like these, don't forget to use the `--fussy` flag so as not to accidentally parse text as metadata.
