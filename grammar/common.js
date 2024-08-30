// Common grammar rules between syntaxes

const { PREC, SEMICOLON } = require('./constants');
const { commaSep1, optionalCommaSep1, sep1 } = require('./utils');

module.exports = {
  // Misc
  // ====

  _normal_identifier: _ => /[a-zA-Z][A-Za-z0-9_\-.]*/,

  // Identifier without two consecutive underscores __
  _top_level_identifier: _ => /[a-zA-Z][A-Za-z0-9_\-.]*(?:_[A-Za-z0-9_\-.]+)*/,

  _id: $ => choice($._normal_identifier, $._top_level_identifier),

  identifier: $ => prec(PREC.call, choice(
    seq(
      // `$.path` is an external symbol, it's the same as an identifier
      // but it must contain a slash '/' in its last lookahead
      repeat1(seq($.path, '/')),
      field('name', alias($._id, $.identifier))
    ),
    field('name', $._id)
  )),

  // comment: _ => token(prec(PREC.comment, seq('#', /.*/))),
  comment: _ => token(seq('#', /(\\+(.|\r?\n)|[^\\\n])*/)),

  os_path: _ => /[A-Za-z0-9.-\/]+/,

  // TODO: Parse HVM code
  hvm_code: _ => /.*\n/,

  parameters: $ => seq(
    '(',
    optional($._parameters),
    ')',
  ),

  _parameters: $ => seq(
    commaSep1($.identifier),
    optional(',')
  ),

  unscoped_var: $ => seq('$', alias($.identifier, 'name')),

  // Literals
  // ========

  _literals: $ => choice(
    $.integer,
    $.float,
    $.character,
    $.string,
    $.symbol,
  ),

  symbol: _ => token(seq('`', /[a-zA-Z0-9+/]{0,4}/, '`')),
  character: _ => token(seq('\'', /[^']+/, '\'')),
  string: _ => token(seq('"', repeat(/[^"]/), '"')),

  integer: _ => token(choice(
    // decimal
    /[+-]?([0-9]+_?)+/,
    // hexadecimal
    /[+-]?(0x|0X)([A-Fa-f0-9]+_?)+/,
    // binary
    /[+-]?(0b|0B)([0-1]+_?)+/,
  )),

  float: _ =>
    token(choice(
      // decimal
      /[+-]?([0-9]+_?)+\.([0-9]+_?)+/,
      // hexadecimal
      /[+-]?(0x|0X)([A-Fa-f0-9]+_?)+\.([A-Fa-f0-9]+_?)+/,
      // binary
      /[+-]?(0b|0B)([0-1]+_?)+\.([0-1]+_?)+/
    )),
}
