const foo = new Promise((resolve) => {
  resolve(new Map());
});

function* a() {
  yield* 1;
}
