// Constants
// =========

// Defines the precedence of a few operators.
const PREC = {
  comment: -1, // solves conflict with the NAT term
  parenthesized_expression: 1,
  comparison: 13,
  bitwise_or: 14,
  bitwise_and: 15,
  xor: 16,
  plus: 18,
  times: 19,
  unary: 20,
  power: 21,
  call: 22,
};

const SEMICOLON = ';';

// Grammar
// =======

module.exports = grammar({
  name: 'bend',

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

  rules: {
    source_file: $ => repeat($._top_level_defs),

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
      $.imp_function_definition,
      $.fun_function_definition
    ),

    body: $ => seq(
      $._indent,
      repeat($._statement),
      $._dedent,
    ),

    // imp syntax
    // ----------
    imp_function_definition: $ => seq(
      'def',
      field('name', $.identifier),
      field('parameters', $.parameters),
      ':',
      $.body,
    ),

    parameters: $ => seq(
      '(',
      optional($._parameters),
      ')',
    ),

    _parameters: $ => seq(
      commaSep1($.identifier),
      optional(',')
    ),

    // fun syntax
    // ----------

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

    // imp syntax
    // ----------

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

    // fun syntax
    // ----------

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

    // Statements
    // ==========

    _statement: $ => choice(
      $._simple_statements,
      $._compound_statement,
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
      choice('=', '<-'),
      field('val', $.expression)
    ),

    _assignment_pattern: $ => seq(
      choice(
        $.identifier,
        $.unscoped_var,
        $.tuple,
        $.superposition,
        $.eraser,
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
      $.do_statement,
    ),

    do_statement: $ => seq(
      'do',
      $.identifier,
      ':',
      $.body
    ),

    bend_statement: $ => seq(
      'bend',
      alias($._args, $.bend_args),
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

    bind: $ => commaSep1(seq(
      $.identifier,
      optional(seq(
        '=',
        $.expression,
      ))
    )),

    fold_statement: $ => seq(
      'fold',
      $.arg_bind,
      optional($.with_args),
      ':',
      alias($._match_body, $.body),
    ),

    arg_bind: $ => seq(
      choice($.identifier, '_'),
      optional(seq(
        '=',
        $.expression
      ))
    ),

    with_args: $ => seq(
      'with',
      $._args
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

    // TODO: missing `with`
    match_statement: $ => seq(
      'match',
      $.arg_bind,
      optional($.with_args),
      ':',
      alias($._match_body, $.body),
    ),

    switch_statement: $ => seq(
      'switch',
      $.arg_bind,
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
      commaSep1(alias($._fun_bend_bind, $.bind)),
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

    fun_switch: $ => seq(
      'switch',
      alias($._fun_arg_bind, $.arg_bind),
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

    _fun_switch_pattern: $ => choice('_', $.integer),

    fun_match: $ => seq(
      'match',
      alias($._fun_arg_bind, $.arg_bind),
      alias($._fun_match_body, $.body),
    ),

    _fun_arg_bind: $ => seq(
      choice($.identifier, '_'),
      optional(seq(
        '=',
        $._terms,
      )),
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

    _fun_eraser: _ => '*',

    _fun_superposition: $ => seq(
      '{',
      optionalCommaSep1($._terms),
      optional(','),
      '}',
    ),

    _fun_list: $ => seq(
      '[',
      commaSep1($._terms),
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

    // Expressions
    // ===========

    expression: $ => choice(
      $.imp_lambda,
      $.simple_expression,
    ),

    simple_expression: $ => choice(
      $.identifier,
      $._literals,
      $.list_comprehension,
      $.unary_op,
      $.binary_op,
      $.comparison_op,
      $.parenthesized_expression,
      $.call_expression,
      $.eraser,
      $.unscoped_var,
    ),

    imp_lambda: $ => seq(
      choice('λ', 'lambda'),
      alias(optionalCommaSep1($.expression), $.parameters),
      optional(','),
      ':',
      field('body', $.expression)
    ),

    eraser: $ => seq('*', optional($.parenthesized_expression)),

    call_expression: $ => prec(PREC.call, seq(
      $.identifier,
      $.arguments,
    )),

    arguments: $ => seq(
      '(',
      optional($._args),
      ')',
    ),

    _args: $ => seq(
      commaSep1(choice($.expression, $.arg_bind)),
      optional(',')
    ),

    arg_bind: $ => seq(
      field('field', $.identifier),
      '=',
      field('value', $.expression)
    ),

    unscoped_var: $ => seq('$', alias($.identifier, 'name')),

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

    // Literals
    // ========

    _literals: $ => choice(
      $.integer,
      $.float,
      $.character,
      $.string,
      $.symbol,
      $.list,
      $.tuple,
      $.map,
      $.superposition,
      $.constructor,
    ),

    symbol: _ => token(seq('`', /[a-zA-Z0-9+/]{0,4}/ ,'`')),
    character: _ => token(seq('\'', /[^']+/, '\'')),
    string: _ => token(seq('"', repeat(/[^"]/), '"')),

    integer: _ => token(choice(
      seq(
        choice('0x', '0X'),
        repeat1(/_?[A-Fa-f0-9]+/),
      ),
      seq(
        choice('0b', '0B'),
        repeat1(/_?[0-1]+/),
      ),
      seq(
        repeat1(/[0-9]+_?/),
      ),
    )),

    float: _ => {
      const digits = repeat1(/[0-9]+_?/);
      return token(seq(digits, '.', digits));
    },

    list: $ => seq(
      '[',
      optional(commaSep1($.expression)),
      optional(','),
      ']',
    ),

    tuple: $ => seq(
      '(',
      optional(commaSep1($.expression)),
      optional(','),
      ')',
    ),

    constructor: $ => seq(
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

    map: $ => seq(
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

    superposition: $ => seq(
      '{',
      optionalCommaSep1($.expression),
      optional(','),
      '}',
    ),

    // Misc
    // ====

    _id: _ => /[a-zA-Z][A-Za-z0-9.-/]*/,
    // Identifier without two consecutive underscores __
    _top_level_identifier: _ => /[a-zA-Z][A-Za-z0-9.-/]*(?:_[A-Za-z0-9.-/]+)*/,

    identifier: $ => choice($._id, $._top_level_identifier),

    comment: _ => token(prec(PREC.comment, seq('#', /.*/))),

  },
});

/**
 * Creates a rule to match one or more of the rules optionally separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @return {SeqRule}
 *
 */
function optionalCommaSep1(rule) {
  return repeat1(seq(optional(','), rule))
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @return {SeqRule}
 *
 */
function commaSep1(rule) {
  return sep1(rule, ',');
}

/**
 * Creates a rule to match one or more occurrences of `rule` separated by `sep`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @return {SeqRule}
 *
 */
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
