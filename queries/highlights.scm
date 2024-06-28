(identifier) @variable

(fun_function_definition
  name: (identifier) @function)
(imp_function_definition
  name: (identifier) @function)
(parameters) @variable.parameter

(object_definition
  name: (identifier) @type)
(object_field
  (identifier) @variable.member)

(imp_type_definition
  name: (identifier) @type)
(imp_type_constructor
  (identifier) @constructor)
(imp_type_constructor_field
  (identifier) @variable.member)

(fun_type_definition
  name: (identifier) @type)
(fun_type_constructor
  (identifier) @constructor)
(fun_type_constructor_fields
  (identifier) @variable.member)

(constructor
  (identifier) @constructor)
(constructor
  field: (identifier) @property)

(call_expression
  (identifier) @function.call)

(switch_case
  (switch_pattern) @character.special
  (#eq? @character.special "_"))

(integer) @number
(float) @number.float

(character) @character
(comment) @comment
[
 (symbol)
 (string)
] @string

[
  ":"
  ","
  ";"
] @punctuation.delimiter

[
  "["
  "]"
  "("
  ")"
  "{"
  "}"
] @punctuation.bracket

[
  "-"
  "-="
  "!="
  "*"
  "**"
  "*="
  "/"
  "/="
  "&"
  "%"
  "^"
  "+"
  "+="
  "<"
  "="
  "=="
  ">"
  "|"
  "~"
  "&"
  "<-"
] @operator

[
  "if"
  "elif"
  "else"
] @keyword.conditional


[
 "def"
  "@"
  "λ"
  "lambda"
] @keyword.function

"return" @keyword.return
"for" @keyword.repeat

[
  "object"
  "type"
] @keyword.type

[
  "with"
  "match"
  "case"
  "open"
  "use"
  "with"
  "bend"
  "when"
  "fold"
  "switch"
  "ask"
  "let"
  "in"
] @keyword
