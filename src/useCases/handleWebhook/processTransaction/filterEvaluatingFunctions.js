const evaluateDirectionFilter = (filter, transaction) => {
  const { direction } = filter;
  const { amount } = transaction;
  if (amount == 0) {
    return false;
  }
  const isPositiveFilter = direction == "in";
  const isPositiveTransaction = amount > 0;
  return isPositiveFilter == isPositiveTransaction;
};

const evaluateAmountFilter = (filter, transaction) => {
  const { test, value } = filter;
  if (value < 0) {
    throw new Error("Filter value must be greater than or equal to 0");
  }
  const { amount } = transaction;
  switch (test) {
    case "gte":
      return Math.abs(amount) >= value;
    case "gt":
      return Math.abs(amount) > value;
    case "lte":
      return Math.abs(amount) <= value;
    case "lt":
      return Math.abs(amount) < value;
    case "equal":
      return Math.abs(amount) == value;
  }
};

const evaluateTextFilter = (filter, transaction) => {
  const { field, caseInsensitive } = filter;
  let { pattern } = filter;
  let value = getValue(transaction, field);
  if (!value) {
    return false;
  }
  ({ pattern, value } = escapeWildcards(pattern, value));
  const regex = convertToRegex(pattern, caseInsensitive);
  return regex.test(value);
};

const escapeWildcards = (pattern, value) => {
  const hasEscapedBackslashBeforeWildcard = /\\\\\*/.test(pattern);
  const hasEscapedWildcard = /\\\*/.test(pattern);
  if (hasEscapedBackslashBeforeWildcard) {
    pattern = pattern.replace(/\\\\\*/g, `\\*`); //   replace \\ with \
  } else if (hasEscapedWildcard) {
    pattern = pattern.replace(/\\\*/g, "¬"); //       replace \* with ¬
    value = value.replace(/\*/g, "¬"); //             replace * with ¬
  }
  return { pattern, value };
};

const evaluateCallTypeFilter = (filter, transaction) => {
  const { call } = filter;
  if (!["any", "created", "updated"].includes(call)) {
    throw new Error("Invalid call type");
  }
  if (call == "any") {
    return true;
  }
  return transaction.callType == "transaction." + call;
};

const getValue = (transaction, field) => {
  if (!field.includes(".")) {
    return transaction[field];
  }
  const path = field.split(".");
  let currentNode = transaction;
  try {
    path.forEach((node) => {
      currentNode = currentNode[node];
    });
  } catch (e) {
    currentNode = undefined;
  }
  return currentNode;
};

const convertToRegex = (str, caseInsensitive) => {
  if (caseInsensitive) {
    return new RegExp(
      "^" + preg_quote(str).replace(/\\\*/g, ".*").replace(/\\\?/, ".") + "$",
      "i"
    );
  } else {
    return new RegExp(
      "^" + preg_quote(str).replace(/\\\*/g, ".*").replace(/\\\?/g, ".") + "$"
    );
  }
};

const preg_quote = (str, delimiter) => {
  return (str + "").replace(
    new RegExp(
      "[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\" + (delimiter || "") + "-]",
      "g"
    ),
    "\\$&"
  );
};

const evaluatingFunctions = {
  direction: evaluateDirectionFilter,
  amount: evaluateAmountFilter,
  text: evaluateTextFilter,
  call: evaluateCallTypeFilter,
};

export default evaluatingFunctions;
