// Utility functions

module.exports = {
    optionalCommaSep1,
    commaSep1,
    sep1
}

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
