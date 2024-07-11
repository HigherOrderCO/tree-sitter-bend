// Common grammar rules between syntaxes

const { PREC, SEMICOLON } = require('./constants');
const { commaSep1, optionalCommaSep1, sep1 } = require('./utils');

module.exports = {
  // Misc
  // ====

  _normal_identifier: _ => /[a-zA-Z][A-Za-z0-9_\-.]*/,
  // _id: _ => /[a-zA-Z][A-Za-z0-9_\-.\/]*/,

  // Identifier without two consecutive underscores __
  _top_level_identifier: _ => /[a-zA-Z][A-Za-z0-9_\-.]*(?:_[A-Za-z0-9_\-.]+)*/,
  // _top_level_identifier: _ => /[a-zA-Z][A-Za-z0-9_\-.\/]*(?:_[A-Za-z0-9_\-.\/]+)*/,

  _id: $ => choice($._normal_identifier, $._top_level_identifier),

  identifier: $ => prec(PREC.call, choice(
    seq(
      $.path,
      '/',
      field('name', alias($._id, $.identifier))
    ),
    field('name', $._id)
  )),

  path: $ => prec(PREC.call, choice(
    seq(
      $.path,
      '/',
      alias($._id, $.part)
    ),
    $._id
  )),

  comment: _ => token(prec(PREC.comment, seq('#', /.*/))),

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
}
