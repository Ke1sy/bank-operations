const initBankOperations = require("./app");

test("Returns error for not existing file", async () => {
  expect(await initBankOperations("not-exist.json")).toEqual([]);
});

test("Returns correct commissions for existing file", async () => {
  expect(await initBankOperations("input.json")).toEqual(["0.06", "0.90", "87.00", "3.00", "0.30", "0.30", "5.00", "0.00", "0.00"]);
});
