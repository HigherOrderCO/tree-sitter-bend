// Description of Bend's `fun` syntax

const { PREC, SEMICOLON } = require('./constants');
const { commaSep1, optionalCommaSep1, sep1 } = require('./utils');

module.exports = {
  // Function definitions
  // ====================

  fun_function_definition: $ => seq(
    $._function_patterns,
    '=',
    alias($._term, $.body),
  ),

  _function_patterns: $ => choice(
    seq('(', $._function_pattern, ')'),
    $._function_pattern
  ),

  _function_pattern: $ => seq(field('name', $.identifier), repeat($.pattern)),

  pattern: $ => choice(
    $.integer,
    $.character,
    $.string,
    alias($._fun_superposition, $.superposition),
    alias($._fun_tuple, $.tuple),
    alias($._fun_list, $.list),
    alias($._fun_eraser, $.eraser),
    $.unscoped_var,
    $.identifier,
    $.pattern_constructor,
  ),

  pattern_constructor: $ => seq(
    '(',
    repeat($.identifier),
    ')'
  ),

  // Type definitions
  // ================

  fun_type_definition: $ => seq(
    'type',
    field('name', $.identifier),
    optional($._indent),
    '=',
    $._fun_type_body,
    optional($._dedent),
  ),

  _fun_type_body: $ => sep1(choice(
    seq('(', $.fun_type_constructor, ')'),
    $.fun_type_constructor,
  ), '|'),

  fun_type_constructor: $ => seq(
    $.identifier,
    optional($.fun_type_constructor_fields)
  ),

  fun_type_constructor_fields: $ => repeat1($._type_constructor_field),

  _type_constructor_field: $ => choice(
    // TODO: maybe create a node or field for the recursive field?
    seq('~', $.identifier),
    $.identifier,
  ),

  // Terms
  // =====

  _term: $ => seq($._terms, $._newline),

  _terms: $ => choice(
    $.num_operator,
    $.identifier,
    $.unscoped_var,
    $.string,
    $.character,
    $.symbol,
    $.integer,
    $.float,
    alias($._fun_eraser, $.eraser),
    alias($._fun_superposition, $.superposition),
    alias($._fun_tuple, $.tuple),
    alias($._fun_list, $.list),
    $.application,
    $.fun_lambda,
    $.let_bind,
    $.use,
    $.fun_match,
    $.fun_fold,
    $.fun_switch,
    $.fun_if,
    $.fun_bend,
    $.fun_open,
    $.fun_ask,
    $.fun_with,
    $.nat,
  ),

  nat: $ => seq('#', $.integer),

  fun_with: $ => seq(
    'with',
    $.identifier,
    alias($._fun_with_body, $.body),
  ),

  _fun_with_body: $ => seq(
    '{',
    $.fun_ask,
    '}'
  ),

  fun_ask: $ => seq(
    'ask',
    $.pattern,
    '=',
    field('value', alias($._terms, $.body)),
    $.ask_next
  ),

  ask_next: $ => seq(
    optional(SEMICOLON),
    $._terms,
  ),

  fun_open: $ => seq(
    'open',
    field('type', $.identifier),
    field('variable', $.identifier),
    SEMICOLON,
    alias($._terms, $.body)
    ),

  fun_bend: $ => seq(
    'bend',
    alias($._fun_args, $.args),
    '{',
    alias($._fun_bend_when, $.when_clause),
    alias($._fun_bend_else, $.else_clause),
    '}'
  ),

  _fun_bend_bind: $ => seq(
    $.identifier,
    optional(seq(
      '=',
      $._terms,
    ))
  ),

  _fun_bend_when: $ => seq(
    'when',
    $._terms,
    ':',
    alias($._terms, $.body)
  ),

  _fun_bend_else: $ => seq(
    'else',
    ':',
    alias($._terms, $.body)
  ),

  fun_if: $ => seq(
    'if',
    field('condition', $._terms),
    alias($._fun_if_body, $.body),
    'else',
    alias($._fun_if_body, $.else_clause)
  ),

  _fun_if_body: $ => seq(
    '{',
    alias($._terms, $.body),
    '}'
  ),

  _fun_switch_pattern: $ => choice('_', $.integer),

  fun_match: $ => seq(
    'match',
    alias($._fun_arg, $.arg),
    optional(alias($.fun_with_args, $.with_args)),
    alias($._fun_match_body, $.body),
  ),

  _fun_match_body: $ => seq(
    '{',
    repeat(alias($._fun_match_case, $.match_case)),
    '}'
  ),

  _fun_match_case: $ => seq(
    alias($._fun_match_pattern, $.match_pattern),
    ':',
    $._terms,
    optional(SEMICOLON)
  ),

  _fun_match_pattern: $ => choice(
    '_',
    $.identifier,
    alias($._fun_eraser, $.eraser)
  ),

  fun_with_args: $ => seq(
    'with',
    $._fun_args_id
  ),

  _fun_args: $ => seq(
    commaSep1($._fun_arg),
    optional(',')
  ),

  _fun_args_id: $ => seq(
    commaSep1($._fun_arg_id),
    optional(',')
  ),

  fun_fold: $ => seq(
    'fold',
    alias($._fun_arg, $.arg),
    optional(alias($.fun_with_args, $.with_args)),
    alias($._fun_match_body, $.body),
  ),

  fun_switch: $ => seq(
    'switch',
    alias($._fun_arg, $.arg),
    optional(alias($.fun_with_args, $.with_args)),
    alias($._fun_switch_body, $.body)
  ),

  _fun_switch_body: $ => seq(
    '{',
    repeat(alias($._fun_switch_case, $.switch_case)),
    '}'
  ),

  _fun_switch_case: $ => seq(
    alias($._fun_switch_pattern, $.switch_pattern),
    ':',
    choice($._terms, $.switch_predecessor),
    optional(SEMICOLON),
  ),

  switch_predecessor: $ => seq(
    field('bind', choice('_', $.identifier)),
    '-',
    $.integer,
  ),

  _fun_arg: $ => choice(
    alias($._terms, $.term),
    alias($._fun_arg_bind, $.arg_bind)
  ),

  _fun_arg_id: $ => choice(
    choice($.identifier, '_'),
    alias($._fun_arg_bind, $.arg_bind)
  ),

  _fun_arg_bind: $ => seq(
    field('field', $.identifier),
    '=',
    field('value', $._terms)
  ),

  _fun_eraser: _ => '*',

  _fun_superposition: $ => seq(
    '{',
    optionalCommaSep1($._terms),
    optional(','),
    '}',
  ),

  _fun_list: $ => seq(
    '[',
    optional(commaSep1($._terms)),
    optional(','),
    ']'
  ),

  _fun_tuple: $ => seq(
    '(',
    commaSep1($._terms),
    optional(','),
    ')'
  ),

  use: $ => seq(
    'use',
    $.identifier,
    '=',
    $.use_value,
    $.use_next,
  ),

  use_value: $ => $._terms,
  use_next: $ => seq(optional(SEMICOLON), $._terms),

  let_bind: $ => seq(
    'let',
    alias($._let_pattern, $.pattern),
    '=',
    $.let_value,
    $.let_next
  ),

  let_value: $ => $._terms,
  let_next: $ => seq(optional(SEMICOLON), $._term),

  _let_pattern: $ => choice(
    $.identifier,
    $.unscoped_var,
    $.tuple,
    $.superposition
  ),

  fun_lambda: $ => seq(
    choice('@', 'λ'),
    $.pattern,
    alias($._terms, $.body),
  ),

  application: $ => seq(
    '(',
    repeat1($._terms),
    ')'
  ),

  operator: $ => choice(
    '+',
    '-',
    '*',
    '/',
    '%',
    '**',
    '|',
    '&',
    '^',
    '==',
    '<',
    '>',
    '!=',
  ),

  num_operator: $ => seq(
    '(',
    $.operator,
    $._terms,
    $._terms,
    ')'
  ),
}
