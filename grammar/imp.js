// Description of Bend's `imp` syntax

const { PREC, SEMICOLON } = require('./constants');
const { commaSep1, optionalCommaSep1, sep1 } = require('./utils');

module.exports = {
  // Function definitions
  // =====================

  imp_function_definition: $ => seq(
    'def',
    field('name', $.identifier),
    field('parameters', $.parameters),
    ':',
    $.body,
  ),

  // Type definitions
  // ================

  imp_type_definition: $ => seq(
    'type',
    field('name', $.identifier),
    ':',
    $._imp_type_def_body,
  ),

  _imp_type_def_body: $ => seq(
    $._indent,
    repeat1($.imp_type_constructor),
    $._dedent,
  ),

  imp_type_constructor: $ => seq(
    $.identifier,
    optional($.imp_type_constructor_field),
  ),

  imp_type_constructor_field: $ => seq(
    '{',
    commaSep1($._type_constructor_field),
    optional(','),
    '}'
  ),

  // Statements
  // ==========

  _statement: $ => choice(
    $._simple_statements,
    $._compound_statement,
  ),

  body: $ => seq(
    $._indent,
    repeat($._statement),
    $._dedent,
  ),


  // Simple statements
  // -----------------

  _simple_statements: $ => seq(
    $._simple_statement,
    optional(SEMICOLON),
    $._newline,
  ),

  _simple_statement: $ => choice(
    $.return_statement,
    $.assignment_statement,
    $.ask_statement,
    $.inplace_op_statement,
    $.use_statement,
    $.open_statement,
  ),

  open_statement: $ => seq(
    'open',
    field('type', $.identifier),
    ':',
    field('var', $.identifier)
  ),

  return_statement: $ => seq(
    'return',
    $.expression,
  ),

  assignment_statement: $ => seq(
    field('pat', $._assignment_pattern),
    choice('='),
    field('val', $.expression)
  ),

  ask_statement: $ => seq(
    field('pat', $._assignment_pattern),
    choice('<-'),
    field('val', $.expression)
  ),

  _assignment_pattern: $ => seq(
    choice(
      $.identifier,
      $.unscoped_var,
      alias($.imp_tuple, $.tuple),
      alias($.imp_superposition, $.superposition),
      alias($.imp_eraser, $.eraser),
      '_' // TODO: alias to something?
    )
  ),

  inplace_op_statement: $ => seq(
    field('pat', $._assignment_pattern),
    field('op', $._inplace_op),
    field('val', $.expression)
  ),

  _inplace_op: $ => choice(
    '+=',
    '-=',
    '*=',
    '/=',
    '&=',
    '|=',
    '^=',
    '@=',
  ),

  use_statement: $ => seq('use', alias($.assignment_statement, 'value')),

  // Compound statements
  // -------------------

  _compound_statement: $ => choice(
    $.if_statement,
    $.bend_statement,
    $.fold_statement,
    $.match_statement,
    $.switch_statement,
    $.with_statement,
    $.local_def_statement
  ),

  with_statement: $ => seq(
    'with',
    $.identifier,
    ':',
    $.body
  ),

  bend_statement: $ => seq(
    'bend',
    alias($._imp_args, $.args),
    ':',
    $._indent,
    $.when_clause,
    $.else_clause,
    $._dedent,
  ),

  when_clause: $ => seq(
    'when',
    $.expression,
    ':',
    $.body
  ),

  fold_statement: $ => seq(
    'fold',
    alias($._imp_arg, $.arg),
    optional($.with_args),
    ':',
    alias($._match_body, $.body),
  ),

  with_args: $ => seq(
    'with',
    $._imp_args_id
  ),

  _match_body: $ => seq(
    $._indent,
    repeat($.match_case),
    $._dedent
  ),

  match_case: $ => seq(
    'case',
    $.match_pattern,
    ':',
    $.body
  ),

  match_pattern: $ => choice(
    $.identifier,
    '_'
  ),

  match_statement: $ => seq(
    'match',
    alias($._imp_arg, $.arg),
    optional($.with_args),
    ':',
    alias($._match_body, $.body),
  ),

  switch_statement: $ => seq(
    'switch',
    alias($._imp_arg, $.arg),
    optional($.with_args),
    ':',
    alias($._switch_body, $.body),
  ),

  _switch_body: $ => seq(
    $._indent,
    repeat($.switch_case),
    $._dedent
  ),

  switch_case: $ => seq(
    'case',
    $.switch_pattern,
    ':',
    $.body
  ),

  switch_pattern: $ => choice($.integer, '_'),

  if_statement: $ => seq(
    'if',
    field('cond', $.expression),
    ':',
    $.body,
    repeat($.elif_clause),
    $.else_clause,
  ),

  elif_clause: $ => seq(
    'elif',
    field('cond', $.expression),
    ':',
    $.body,
  ),

  else_clause: $ => seq(
    'else',
    ':',
    $.body,
  ),

  local_def_statement: $ => seq(
    'def',
    field('name', $.identifier),
    field('parameters', $.parameters),
    ':',
    $.body
  ),

  // Expressions
  // ===========

  expression: $ => choice(
    $.imp_lambda,
    $.simple_expression,
  ),

  simple_expression: $ => choice(
    $.identifier,
    $._literals,
    alias($.imp_list, $.list),
    alias($.imp_tree_node, $.tree_node),
    alias($.imp_tree_leaf, $.tree_leaf),
    alias($.imp_tuple, $.tuple),
    alias($.imp_constructor, $.constructor),
    alias($.imp_map, $.map),
    alias($.imp_superposition, $.superposition),
    alias($.imp_eraser, $.eraser),
    $.list_comprehension,
    $.unary_op,
    $.binary_op,
    $.comparison_op,
    $.parenthesized_expression,
    $.call_expression,
    $.unscoped_var,
  ),

  imp_list: $ => seq(
    '[',
    optional(commaSep1($.expression)),
    optional(','),
    ']',
  ),

  imp_tree_node: $ => seq(
    '![',
    $.expression,
    optional(','),
    $.expression,
    ']'
  ),

  imp_tree_leaf: $ => seq(
    '!',
    $.expression
  ),

  imp_tuple: $ => seq(
    '(',
    optional(commaSep1($.expression)),
    optional(','),
    ')',
  ),

  imp_constructor: $ => seq(
    $.identifier,
    '{',
    commaSep1($._cons_pair),
    '}'
  ),

  _cons_pair: $ => seq(
    field('field', $.identifier),
    ':',
    field('value', $.expression)
  ),

  imp_map: $ => seq(
    '{',
    optional(commaSep1($._pair)),
    optional(','),
    '}',
  ),

  _pair: $ => seq(
    field('key', $._literals),
    ':',
    field('value', $.expression),
  ),

  imp_superposition: $ => seq(
    '{',
    optionalCommaSep1($.expression),
    optional(','),
    '}',
  ),

  imp_lambda: $ => seq(
    choice('λ', 'lambda'),
    alias(optionalCommaSep1($.expression), $.parameters),
    optional(','),
    ':',
    field('body', $.expression)
  ),

  imp_eraser: $ => seq('*', optional($.parenthesized_expression)),

  call_expression: $ => prec(PREC.call, seq(
    $.identifier,
    $.arguments,
  )),

  arguments: $ => seq(
    '(',
    optional($._imp_args),
    ')',
  ),

  _imp_args: $ => seq(
    commaSep1($._imp_arg),
    optional(',')
  ),

  _imp_args_id: $ => seq(
    commaSep1($._imp_arg_id),
    optional(',')
  ),

  _imp_arg: $ => choice(
    $.expression,
    alias($._imp_arg_bind, $.arg_bind)
  ),

  _imp_arg_id: $ => choice(
    choice($.identifier, '_'),
    alias($._imp_arg_bind, $.arg_bind)
  ),

  _imp_arg_bind: $ => seq(
    field('field', $.identifier),
    '=',
    field('value', $.expression)
  ),

  parenthesized_expression: $ => prec(PREC.parenthesized_expression, seq(
    '(',
    $.expression,
    ')'
  )),

  binary_op: $ => {
    const table = [
      [prec.left, '+', PREC.plus],
      [prec.left, '-', PREC.plus],
      [prec.left, '*', PREC.times],
      [prec.left, '/', PREC.times],
      [prec.left, '%', PREC.times],
      [prec.right, '**', PREC.power],
      [prec.left, '|', PREC.bitwise_or],
      [prec.left, '&', PREC.bitwise_and],
      [prec.left, '^', PREC.xor],
    ];

    return choice(...table.map(([fn, op, precedence]) => fn(precedence, seq(
      $.expression,
      op,
      $.expression
    ))));
  },

  unary_op: $ => prec(PREC.unary, seq(
    choice('-', '+'),
    $.simple_expression,
  )),

  comparison_op: $ => prec.left(PREC.comparison, seq(
    $.simple_expression,
    seq(
      choice(
        '==',
        '<',
        '>',
        '!=',
      ),
      $.simple_expression
    )
  )),

  list_comprehension: $ => seq(
    '[',
    field('body', $.expression),
    $.for_clause,
    optional($.if_clause),
    ']',
  ),

  for_clause: $ => seq(
    'for',
    field('left', $.identifier),
    'in',
    field('right', $.expression),
    optional($.if_clause),
  ),

  if_clause: $ => seq(
    'if',
    $.expression
  ),
}
