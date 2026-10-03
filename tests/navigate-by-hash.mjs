// Chapter navigation remains available through deep links. Header entries are
// placeholders, so chapter tests must not use the former header shortcuts.
export async function navigateByHash(page,hash){
  await page.evaluate(hash=>{
    history.pushState(null,'',hash);
    dispatchEvent(new HashChangeEvent('hashchange'));
  },hash);
}
