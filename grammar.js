const { optionalCommaSep1, commaSep1, sep1 } = require('./grammar/utils')
const { PREC, SEMICOLON } = require('./grammar/constants')

const imp = require('./grammar/imp')
const fun = require('./grammar/fun')
const common = require('./grammar/common')

// Grammar
// =======

module.exports = grammar({
  name: 'bend',

  rules: {
    source_file: $ => repeat($._top_level_defs),

    ...imp, // Imperative-like syntax
    ...fun, // Functional-like syntax
    ...common, // Common rules between syntaxes

    // Top-level definitions
    // =====================

    _top_level_defs: $ => choice(
      $._func_def,
      $.object_definition,
      $._type_definition,
    ),

    // Function definitions
    // ====================

    _func_def: $ => choice(
      $.imp_function_definition, // Uses "Statements"
      $.fun_function_definition, // Uses "Terms"
    ),

    // Object definitions
    // ==================

    object_definition: $ => seq(
      'object',
      field('name', $.identifier),
      $._object_def_body,
    ),

    _object_def_body: $ => seq(
      '{',
      optional(commaSep1(field('field', $.object_field))),
      optional(','),
      '}',
    ),

    object_field: $ => $.identifier,

    // Type definitions
    // ================

    _type_definition: $ => choice(
      $.imp_type_definition,
      $.fun_type_definition
    ),
  },

  extras: $ => [
    $.comment,
    /[\s\f\uFEFF\u2060\u200B]|\r?\n/,
  ],

  externals: $ => [
    $._newline,
    $._indent,
    $._dedent,

    // Mark comments as external tokens so that the external scanner is always
    // invoked, even if no external token is expected. This allows for better
    // error recovery, because the external scanner can maintain the overall
    // structure by returning dedent tokens whenever a dedent occurs, even
    // if no dedent is expected.
    $.comment,
  ],

  inline: $ => [
    $._simple_statement,
    $._compound_statement,
    $.expression,
    $.simple_expression,
  ],

  conflicts: $ => [
    [$.for_clause],
    [$.eraser],
    [$.fun_type_constructor],
    [$.fun_type_constructor_fields],
    [$.constructor, $.superposition],
    [$.imp_lambda, $.constructor],
    [$._fun_eraser, $.operator],
    [$._fun_tuple, $.application],
    [$.pattern_constructor, $._terms],
  ],

  word: $ => $._id,
});
