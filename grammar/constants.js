// Constants
// =========

module.exports = {
  // Defines the precedence of a few operators.
  PREC: {
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
    comment: 100,
    multiline_comment: 101,
  },

  SEMICOLON: ';'
}
