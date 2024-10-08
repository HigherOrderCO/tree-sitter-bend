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

    ...common, // Common rules between syntaxes
    ...imp, // Imperative-like syntax
    ...fun, // Functional-like syntax

    // Top-level definitions
    // =====================

    _top_level_defs: $ => choice(
      $._import,
      $._func_def,
      $.object_definition,
      $._type_definition,
      $.hvm_definition
    ),

    // Import definition
    // =================

    _import: $ => choice(
      $.import_name,
      $.import_from
    ),

    import_name: $ => seq(
      'import',
      $.os_path
    ),

    import_from: $ => seq(
      'from',
      $.os_path,
      'import',
      $.os_path
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

    // HVM defintions
    // ==============

    hvm_definition: $ => seq(
      'hvm',
      field('name', $.identifier),
      ':',
      // $._newline,
      $._indent,
      // TODO: multiple lines of `hvm_code` should be the same expression
      repeat1(field('code', $.hvm_code)),
      $._dedent
    ),
  },

  extras: $ => [
    $.multiline_comment,
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

    // Normal identifiers with a slash '/' after their last character.
    $.path,

    $.error_sentinel
  ],

  inline: $ => [
    $._simple_statement,
    $._compound_statement,
    $.expression,
    $.simple_expression,
  ],

  conflicts: $ => [
    [$.for_clause],
    [$.imp_eraser],
    [$.fun_type_constructor],
    [$.fun_type_constructor_fields],
    [$.imp_constructor, $.imp_superposition],
    [$.imp_lambda, $.imp_constructor],
    [$._fun_eraser, $.operator],
    [$.imp_tuple, $.arguments],
    [$.imp_tuple, $._imp_arg],
    [$.imp_tree_leaf, $.imp_constructor],
    [$._function_pattern, $._terms],
    [$._fun_args]
  ],

  word: $ => $._normal_identifier,

  supertypes: $ => [$._id],
});
