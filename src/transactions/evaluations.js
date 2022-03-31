const evaluateDirectionFilter = (filter, transaction) => {
  const { direction } = filter;
  const { amount } = transaction;
  const positiveFilter = direction == "in";
  const positiveTransaction = amount >= 0;
  return positiveFilter == positiveTransaction;
};

const evaluateAmountFilter = (filter, transaction) => {
  const { test, value } = filter;
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
  const { field, pattern, caseInsensitive } = filter;
  const regex = convertToRegex(pattern, caseInsensitive);
  const value = getValue(transaction, field);
  return regex.test(value);
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
      preg_quote(str).replace(/\\\*/g, ".*").replace(/\\\?/g, "."),
      "i"
    );
  } else {
    return new RegExp(
      preg_quote(str).replace(/\\\*/g, ".*").replace(/\\\?/g, ".")
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
};

export default evaluatingFunctions;
