function toHalfWidth(str) {
  return str.replace(/（/g, "(").replace(/）/g, ")");
}

const str = "（哈囉）";

console.log(toHalfWidth(str)); // (Hello)
