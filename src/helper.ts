export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};
let make_UUID = () => {
  return crypto.randomUUID();
};

let get_new_list = (number: number) => {
  let example = `
<hr id="${make_UUID()}"><p id="${make_UUID()}"></p><p id="${make_UUID()}">NUM ${number}</p><p id="${make_UUID()}"></p><p id="${make_UUID()}"><formula id="${make_UUID()}" formula="MUL(10,20)" value="" result="" data="200" data-type="math-component"></formula></p><p id="${make_UUID()}">price dog 120</p><hr id="${make_UUID()}"><p id="${make_UUID()}">price dog 20</p><p id="${make_UUID()}">price dog 30</p><p id="${make_UUID()}">total price <formula id="${make_UUID()}" formula="SUM(EVAL(!&quot;price dog {NUMBER}&quot;),10)" value="" result="" data="50" data-type="math-component"></formula></p><hr id="${make_UUID()}"><p id="${make_UUID()}">some dog price</p>`;
  return example;
};

export let final_list = [...new Array(300)]
  .map((_, i) => get_new_list(i))
  .join("");

export const getExcelColumnName = (colIndex: number) => {
  let columnName = "";
  while (colIndex > 0) {
    let remainder = (colIndex - 1) % 26;
    columnName = String.fromCharCode(65 + remainder) + columnName;
    colIndex = Math.floor((colIndex - 1) / 26);
  }
  return columnName;
};

export const welcome_text = `
<h1>Welcome to RuNo!</h1>
<p>Runo allows you to create documents with embedded formulas and database connections.</p>
<p>To learn more about how to use Runo, check out our documentation.</p>
<p>To start using Runo, simply type in the editor and use the toolbar to format your text.</p>
`;
