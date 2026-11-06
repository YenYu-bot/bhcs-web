// Visual order only: acid-ui renders this after hasHydrogenChain validates its evidence.
export function renderHydrogenChain(){
 const elements=[['Zn','鋅'],['Fe','鐵'],['H','氫'],['Cu','銅']];
 const cards=elements.map(([symbol,name])=>`<span class="order-element${symbol==='H'?' hydrogen':''}" aria-hidden="true"><b>${name}</b><small>${symbol}</small></span>`).join('<i class="order-more" aria-hidden="true">＞</i>');
 return `<h3>把實驗證據與參考知識合起來</h3><div class="hydrogen-order" role="img" aria-label="依前述證據與參考知識：鋅大於鐵，鐵大於氫，氫大於銅。">${cards}</div><p>Zn ＞ Fe：前章置換證據。Fe ＞ H：本章產氫反應與模型。H ＞ Cu：本課參考知識。<br>氫是比較基準；這不是全部金屬的完整排序。鋅與鐵都產氣，本身不足以排它們的先後。</p>`;
}
