document.addEventListener('DOMContentLoaded', () => {
    const totalRecycled = localStorage.getItem('itemsRecycled') || 0;
    document.getElementById('totalRecycled').textContent = totalRecycled;
});

function redeemCoupon() {
    document.getElementById('couponContainer').style.display = 'block';
}
