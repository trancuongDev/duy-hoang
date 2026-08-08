/* DHDT LMS — Trung Thu greeting popup (100 wishes) */
(function () {
  var WISHES = [
    'Trung Thu ấm áp — chúc bạn học Toán vui và tiến bộ mỗi ngày.',
    'Ánh trăng sáng tỏ, kiến thức cũng sáng theo — chúc bạn học thật tốt.',
    'Chúc Trung Thu an lành, điểm số vững vàng, tinh thần luôn rạng rỡ.',
    'Đêm trăng tròn, chúc bạn chinh phục mọi bài toán khó.',
    'Trung Thu này, chúc bạn giữ vững đam mê học tập và đạt kết quả xứng đáng.',
    'Chúc bạn một mùa Trung Thu nhẹ nhàng, học hành hiệu quả.',
    'Trăng vàng soi lối, chúc bạn luôn tìm được lời giải hay nhất.',
    'Chúc Trung Thu vui vẻ — học Toán chăm chỉ, thành công sẽ đến.',
    'Mùa trăng tròn, chúc bạn bình an và học tập ngày càng xuất sắc.',
    'Chúc bạn Trung Thu hạnh phúc, vững vàng trên hành trình luyện thi.',
    'Ánh đèn lồng lung linh, chúc bạn học tập luôn tràn đầy năng lượng.',
    'Trung Thu đến, chúc bạn thêm tự tin với từng dạng bài Toán.',
    'Chúc bạn đêm trăng ấm áp và một kỳ học thật bứt phá.',
    'Trăng sáng sân nhà, chúc bạn sáng cả tư duy và điểm số.',
    'Chúc Trung Thu an yên — học giỏi, ngủ ngon, tinh thần thoải mái.',
    'Mùa Trung Thu, chúc bạn giữ nhịp học đều và tiến bộ rõ rệt.',
    'Chúc bạn dưới ánh trăng vẫn giữ được nhiệt huyết học tập.',
    'Trung Thu vui vẻ — chúc bạn giải bài nhanh, làm đề chắc tay.',
    'Chúc bạn một mùa trăng tròn đầy cảm hứng và kết quả tốt đẹp.',
    'Ánh trăng dịu dàng, chúc bạn học Toán nhẹ nhàng mà hiệu quả.',
    'Chúc Trung Thu sum vầy, kiến thức vững chắc, tương lai rộng mở.',
    'Trăng tròn đêm nay, chúc bạn đạt mục tiêu học tập đã đề ra.',
    'Chúc bạn Trung Thu ấm áp và hành trình luyện thi thật suôn sẻ.',
    'Đêm Trung Thu, chúc bạn luôn tìm thấy niềm vui trong học Toán.',
    'Chúc bạn học tập chăm chỉ, Trung Thu này thêm nhiều thành tích mới.',
    'Ánh vàng Trung Thu, chúc bạn điểm vàng trong các kỳ kiểm tra.',
    'Chúc bạn mùa trăng bình an, sức khỏe tốt, học hành tấn tới.',
    'Trung Thu rộn ràng, chúc bạn giữ vững phong độ học tập.',
    'Chúc bạn đêm trăng đẹp và một lộ trình học thật rõ ràng.',
    'Dưới trăng vàng, chúc bạn vững bước chinh phục môn Toán.',
    'Chúc Trung Thu hạnh phúc — học giỏi hơn mỗi ngày.',
    'Trăng sáng, lòng sáng — chúc bạn học tập luôn tích cực.',
    'Chúc bạn một mùa Trung Thu tràn đầy động lực học tập.',
    'Ánh trăng soi đường, chúc bạn không ngại bất kỳ bài toán nào.',
    'Chúc Trung Thu vui — kiến thức sâu, điểm số cao.',
    'Mùa trăng này, chúc bạn học tập đều đặn và kết quả ấn tượng.',
    'Chúc bạn đêm Trung Thu ấm áp cùng quyết tâm luyện thi vững vàng.',
    'Trăng tròn như ước nguyện — chúc bạn đạt điểm như mong đợi.',
    'Chúc bạn Trung Thu nhẹ lòng, học hành có phương pháp.',
    'Ánh đèn Trung Thu, chúc bạn học Toán ngày càng tự tin.',
    'Chúc mùa trăng an lành và hành trình học tập đầy quả ngọt.',
    'Trung Thu này, chúc bạn giữ lửa học tập và vượt qua chính mình.',
    'Chúc bạn dưới ánh trăng vẫn kiên trì với từng trang bài tập.',
    'Đêm trăng đẹp, chúc bạn có thêm nhiều bài học giá trị.',
    'Chúc Trung Thu vui vẻ — tư duy sắc bén, làm bài chắc chắn.',
    'Ánh trăng vàng, chúc bạn vàng cả thành tích học tập.',
    'Chúc bạn mùa Trung Thu tràn đầy hy vọng và tiến bộ rõ nét.',
    'Trăng sáng sân trường trong tim — chúc bạn học thật vui.',
    'Chúc bạn Trung Thu bình yên, sức học dồi dào.',
    'Mùa trăng tròn, chúc bạn chinh phục mục tiêu điểm số mới.',
    'Chúc Trung Thu ấm áp — mỗi ngày học là một bước tiến.',
    'Ánh trăng dịu êm, chúc bạn học tập tỉnh táo và hiệu quả.',
    'Chúc bạn đêm trăng hạnh phúc và kỳ thi sắp tới thật thuận lợi.',
    'Trung Thu đến rồi, chúc bạn học giỏi hơn cả ngày thường.',
    'Chúc bạn giữ nhịp ôn luyện, Trung Thu này thêm vững vàng.',
    'Dưới trăng vàng, chúc bạn tìm thấy lối giải đẹp cho mọi bài.',
    'Chúc Trung Thu vui — học hành có kế hoạch, kết quả có chiều sâu.',
    'Ánh trăng soi sáng, chúc bạn soi rõ điểm yếu để cải thiện.',
    'Chúc bạn một mùa Trung Thu đầy nghị lực và thành công nhỏ mỗi ngày.',
    'Trăng tròn đêm nay, chúc bạn tròn vẹn ước mơ học tập.',
    'Chúc Trung Thu an lành cùng DHDT LMS trên hành trình Toán học.',
    'Ánh đèn lồng, chúc bạn học tập ấm áp và bền bỉ.',
    'Chúc bạn Trung Thu vui vẻ, làm bài tập cũng vui theo.',
    'Mùa trăng này, chúc bạn thêm tự tin trước mọi đề khó.',
    'Chúc bạn đêm trăng đẹp và điểm số đẹp hơn mỗi tuần.',
    'Trung Thu rạng rỡ, chúc bạn rạng rỡ cả trên bảng điểm.',
    'Chúc bạn học Toán chăm chỉ, Trung Thu này thật nhiều niềm vui.',
    'Ánh trăng vàng óng, chúc bạn óng ánh cả thành quả học tập.',
    'Chúc Trung Thu hạnh phúc — kiên trì hôm nay, thành công ngày mai.',
    'Dưới ánh trăng, chúc bạn luôn giữ được sự tập trung khi học.',
    'Chúc bạn mùa Trung Thu nhẹ nhàng mà đầy tiến bộ.',
    'Trăng sáng lòng thanh, chúc bạn học tập thanh thản và hiệu quả.',
    'Chúc Trung Thu vui — ôn luyện đều, làm đề chắc, tâm thế vững.',
    'Ánh trăng đêm thu, chúc bạn thu về thật nhiều kiến thức bổ ích.',
    'Chúc bạn Trung Thu ấm áp và một tinh thần học tập luôn tươi mới.',
    'Mùa trăng tròn, chúc bạn không bỏ cuộc với bất kỳ dạng bài nào.',
    'Chúc bạn đêm Trung Thu đẹp và lộ trình luyện thi ngày càng rõ.',
    'Trăng vàng như lời động viên — chúc bạn học thật tốt hôm nay.',
    'Chúc Trung Thu an yên, học hành tấn tới, sức khỏe dồi dào.',
    'Ánh trăng dịu dàng, chúc bạn dịu dàng vượt qua áp lực ôn thi.',
    'Chúc bạn mùa trăng này thêm nhiều bài giải hay và điểm cao.',
    'Trung Thu sum vầy, chúc bạn sum họp cả niềm vui học tập.',
    'Chúc bạn dưới trăng vẫn giữ quyết tâm chinh phục Toán.',
    'Ánh đèn Trung Thu, chúc bạn sáng tỏ mọi khái niệm khó.',
    'Chúc Trung Thu vui vẻ — học giỏi, chơi vui, cân bằng nhịp sống.',
    'Mùa trăng vàng, chúc bạn vàng cả tư duy logic và kỹ năng làm bài.',
    'Chúc bạn một đêm Trung Thu ấm và một tuần học thật năng suất.',
    'Trăng tròn ước nguyện tròn — chúc bạn đạt mục tiêu đã chọn.',
    'Chúc bạn Trung Thu bình an cùng những giờ học đầy hiệu quả.',
    'Ánh trăng soi lối học, chúc bạn đi đúng hướng và tiến xa.',
    'Chúc Trung Thu hạnh phúc — mỗi bài tập là một viên gạch vững chắc.',
    'Dưới ánh trăng thu, chúc bạn thu được kết quả xứng với công sức.',
    'Chúc bạn mùa Trung Thu này học tập tự tin và bản lĩnh hơn.',
    'Trăng sáng như niềm tin — chúc bạn tin vào chính mình khi làm bài.',
    'Chúc Trung Thu ấm áp, điểm số ổn định, tinh thần luôn tích cực.',
    'Ánh vàng đêm trăng, chúc bạn vàng cả quá trình và kết quả.',
    'Chúc bạn Trung Thu vui — học Toán mỗi ngày một chút, tiến bộ dài lâu.',
    'Mùa trăng tròn, chúc bạn tròn đầy năng lượng cho kỳ thi phía trước.',
    'Chúc bạn đêm Trung Thu đẹp và hành trình DHDT LMS thật ý nghĩa.',
    'Trăng vàng DHDT LMS — chúc bạn Trung Thu an lành, học Toán thật hay.'
  ];

  var SESSION_KEY = 'dhdt_tt_wish_shown';

  function pickWish() {
    return WISHES[Math.floor(Math.random() * WISHES.length)];
  }

  function closePopup() {
    var overlay = document.getElementById('ttWishPopup');
    if (!overlay) return;
    overlay.classList.add('tt-wish-out');
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 280);
  }

  function showPopup() {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');

    var wish = pickWish();
    var overlay = document.createElement('div');
    overlay.id = 'ttWishPopup';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'ttWishTitle');
    overlay.innerHTML =
      '<div class="tt-wish-card">' +
        '<button type="button" class="tt-wish-close" aria-label="Đóng">✕</button>' +
        '<div class="tt-wish-moon" aria-hidden="true"></div>' +
        '<p class="tt-wish-kicker">DHDT LMS</p>' +
        '<h2 id="ttWishTitle" class="tt-wish-title">Anh Duy Hoàng Chúc Mừng Trung Thu Bạn</h2>' +
        '<p class="tt-wish-msg"></p>' +
        '<button type="button" class="tt-wish-btn">Nhận lời chúc</button>' +
      '</div>';

    overlay.querySelector('.tt-wish-msg').textContent = wish;

    var style = document.createElement('style');
    style.textContent =
      '#ttWishPopup{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:1.25rem;background:rgba(8,10,24,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:ttWishIn .35s ease both}' +
      '#ttWishPopup.tt-wish-out{animation:ttWishFade .28s ease both}' +
      '@keyframes ttWishIn{from{opacity:0}to{opacity:1}}' +
      '@keyframes ttWishFade{to{opacity:0}}' +
      '@keyframes ttWishCard{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}' +
      '.tt-wish-card{position:relative;width:min(420px,100%);background:linear-gradient(165deg,#1a1440 0%,#2a1830 55%,#0b1026 100%);border:1px solid rgba(245,215,110,.35);border-radius:22px;padding:2.1rem 1.6rem 1.5rem;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.04) inset;animation:ttWishCard .4s .05s ease both;overflow:hidden}' +
      '.tt-wish-card::before{content:"";position:absolute;top:-40%;left:50%;transform:translateX(-50%);width:220px;height:220px;background:radial-gradient(circle,rgba(255,244,214,.28),transparent 68%);pointer-events:none}' +
      '.tt-wish-close{position:absolute;top:.75rem;right:.75rem;width:34px;height:34px;border:none;border-radius:50%;background:rgba(255,255,255,.08);color:rgba(255,255,255,.75);font-size:.95rem;cursor:pointer;z-index:2}' +
      '.tt-wish-close:hover{background:rgba(255,255,255,.14);color:#fff}' +
      '.tt-wish-moon{width:64px;height:64px;margin:0 auto .9rem;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fffaf0,#f5d76e 55%,#e8a317);box-shadow:0 0 28px rgba(245,215,110,.55);position:relative;z-index:1}' +
      '.tt-wish-moon::after{content:"";position:absolute;top:8px;right:4px;width:42px;height:42px;border-radius:50%;background:#1a1440}' +
      '.tt-wish-kicker{position:relative;z-index:1;font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(245,215,110,.85);margin:0 0 .35rem}' +
      '.tt-wish-title{position:relative;z-index:1;font-family:Georgia,"Times New Roman",serif;font-size:clamp(1.15rem,3.8vw,1.45rem);font-weight:700;color:#fff8eb;margin:0 0 1rem;letter-spacing:.01em;line-height:1.35;padding:0 .25rem}' +
      '.tt-wish-msg{position:relative;z-index:1;font-size:.95rem;line-height:1.7;color:rgba(247,241,230,.78);margin:0 0 1.4rem;min-height:3.4em}' +
      '.tt-wish-btn{position:relative;z-index:1;width:100%;padding:.85rem 1rem;border:none;border-radius:12px;font-size:.95rem;font-weight:700;color:#fff;cursor:pointer;background:linear-gradient(135deg,#e85d04,#9a031e);box-shadow:0 10px 28px rgba(232,93,4,.4)}' +
      '.tt-wish-btn:hover{filter:brightness(1.08)}';
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    overlay.querySelector('.tt-wish-close').addEventListener('click', closePopup);
    overlay.querySelector('.tt-wish-btn').addEventListener('click', closePopup);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closePopup();
    });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') {
        closePopup();
        document.removeEventListener('keydown', onKey);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(showPopup, 450);
    });
  } else {
    setTimeout(showPopup, 450);
  }
})();
