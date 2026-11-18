/**
 * @OnlyCurrentDoc
 *
 * P10 · The Price of Dinner · Dựng Google Sheet thu giá.
 * Script tạo 9 trang: "Tổng quan" và "Tuần 1" đến "Tuần 8".
 *
 * Danh sách hàm chạy chỉ có 3 hàm:
 *   - setupSheet: dựng bảng mới từ đầu. Chỉ dùng cho bảng trống; tự dừng nếu đã có mặt hàng hoặc giá.
 *   - fixFormulas: sửa lỗi #ERROR! bằng cách viết lại công thức. Không đụng đến dữ liệu.
 *   - replaceInterviewQuestions: đổi trang "Câu hỏi phỏng vấn" từ 12 câu sang 8 câu.
 *     Hàm này sao lưu nguyên trang cũ thành tab "Câu hỏi phỏng vấn (12 câu cũ)" trước khi đổi,
 *     và mang vai trò, ô đồng ý, ghi chú trả lời cũ sang trang mới. Không xoá dữ liệu nào.
 */

const MEMBERS = [
  'Nguyễn Hoàng Minh', 'Phạm Quang Minh', 'Phạm Tuấn Anh',
  'Trần Nhã Đoan', 'Nguyễn Minh Nguyệt', 'Trần Nguyễn Thanh Thảo',
];

// SCHEDULE[tuần - 1][người] = [số mặt hàng, số mặt hàng], theo thứ tự MEMBERS.
// Lịch được xếp ngẫu nhiên một lần bằng Python (seed 20261013) với ba ràng buộc:
//   - tuần 1 đến 6: mỗi người đi đủ 12 mặt hàng, không lặp lại;
//   - không ai làm lại mặt hàng của tuần liền trước;
//   - 48 cặp mặt hàng trong 8 tuần không cặp nào trùng nhau.
const SCHEDULE = [
  [[1, 12], [5, 11], [4, 7], [2, 10], [3, 6], [8, 9]],
  [[2, 9], [3, 8], [1, 5], [4, 12], [10, 11], [6, 7]],
  [[7, 8], [4, 6], [10, 12], [1, 3], [5, 9], [2, 11]],
  [[3, 11], [9, 10], [2, 8], [5, 6], [7, 12], [1, 4]],
  [[4, 5], [2, 12], [6, 11], [7, 9], [1, 8], [3, 10]],
  [[6, 10], [1, 7], [3, 9], [8, 11], [2, 4], [5, 12]],
  [[3, 5], [4, 11], [2, 7], [9, 12], [1, 6], [8, 10]],
  [[1, 2], [3, 12], [4, 10], [6, 8], [5, 7], [9, 11]],
];

const OV = 'Tổng quan';
const OVR = "'Tổng quan'!";
const INTERVIEW = 'Câu hỏi phỏng vấn';
const FIRST = 6;           // dòng dữ liệu đầu tiên trên trang Tuần
const LAST = 77;            // dòng dữ liệu cuối: 6 người × 12 dòng
const CHANNELS = ['Chợ', 'Siêu thị', 'App'];

// Cột trên trang Tuần (A = 1)
//  A Mặt hàng · B Kênh · C Quận · D Người được giao · E Ngày thu · F Giờ · G Giá · H Số lượng · I Đơn vị
//  J Khuyến mãi · K Tình trạng · L Phí giao · M Ảnh · N Người thu thực tế · O Ghi chú · P Trạng thái
//  Q Người thu (tự tính, ẩn)
const NCOL = 16;            // số cột hiện ra (A đến P)

// Vị trí ô trên trang Tổng quan
const POS = {
  distA: '$D$10', distB: '$D$11', appOdd: '$H$10', appEven: '$H$11',
  item0: 14,      // mặt hàng n nằm ở dòng 14 + n
  sched0: 29,     // người i (0-5) nằm ở dòng 30 + i
  week0: 39,      // tuần w nằm ở dòng 39 + w
  member0: 50,    // người i nằm ở dòng 51 + i
  full0: 60,      // bảng giá: dòng 61 + (n-1)*6 + kênh*2 + quận
};

const COLOR = {
  ink: '#15201A', ink2: '#46544B', green: '#16724E', soft: '#D8EADF', bg: '#F1F4EF',
  line: '#CDD6CB', input: '#FFF8DC', calc: '#F6F8F4', empty: '#EEF1EC', band: '#F3F6F1',
  grab: '#1E7F4F', shopee: '#D9531E', grabTint: '#EAF4EE', shopeeTint: '#FBEDE6',
};
const CH_COLOR = {
  'Chợ': ['#FBE3D3', '#8A3B00'],
  'Siêu thị': ['#D6E4EF', '#004B7A'],
  'App': ['#DDEFFA', '#1F5F80'],
};
const STATUS = [
  ['Đủ', '#D8EADF', '#16724E', 'Có giá, số lượng và đơn vị'],
  ['Chưa nhập', '#ECEFEA', '#6B776F', 'Chưa có giá'],
  ['Hết hàng', '#E9E3F3', '#5B3F8C', 'Mặt hàng hết, không tính vào 500 giá'],
  ['Sai đơn vị', '#F7DDD6', '#BE3B25', 'Đơn vị không khớp đơn vị chuẩn của mặt hàng'],
  ['Thiếu số lượng', '#F7DDD6', '#BE3B25', 'Có giá nhưng thiếu số lượng hoặc đơn vị'],
];

/* ---------- tiện ích ---------- */

const code = n => 'SP' + String(n).padStart(2, '0');
const appCell = w => (w % 2 === 1 ? POS.appOdd : POS.appEven);
const appColor = w => (w % 2 === 1 ? COLOR.grab : COLOR.shopee);
const weekRef = w => `'Tuần ${w}'!`;
const colLetter = c => String.fromCharCode(64 + c);
// Tên mặt hàng n; nếu nhóm chưa đặt tên thì hiện mã SP.
const itemName = (n, pre) => `IF(${pre}$D$${POS.item0 + n}="","${code(n)}",${pre}$D$${POS.item0 + n})`;

// Dòng trên trang Tuần w chứa mặt hàng n, kênh ch (0-2), quận d (0-1).
function weekRow_(w, n, ch, d) {
  const wk = SCHEDULE[w - 1];
  for (let i = 0; i < wk.length; i++) {
    const j = wk[i].indexOf(n);
    if (j >= 0) return FIRST + i * 12 + j * 6 + ch * 2 + d;
  }
  throw new Error('Không tìm thấy ' + code(n) + ' ở tuần ' + w);
}

// Gộp ô (nếu cần), ghi giá trị hoặc công thức vào ô đầu, rồi định dạng.
function put_(sh, a1, value, o) {
  o = o || {};
  const rg = sh.getRange(a1);
  if (rg.getNumRows() * rg.getNumColumns() > 1) rg.merge();
  if (value !== undefined && value !== null) {
    const c = sh.getRange(a1.split(':')[0]);
    if (typeof value === 'string' && value.charAt(0) === '=') c.setFormula(value);
    else c.setValue(value);
  }
  if (o.bg) rg.setBackground(o.bg);
  if (o.fg) rg.setFontColor(o.fg);
  if (o.bold) rg.setFontWeight('bold');
  if (o.size) rg.setFontSize(o.size);
  if (o.wrap) rg.setWrap(true);
  if (o.align) rg.setHorizontalAlignment(o.align);
  if (o.fmt) rg.setNumberFormat(o.fmt);
  return rg;
}

function section_(sh, a1, text) {
  put_(sh, a1, text, { bg: COLOR.green, fg: '#FFFFFF', bold: true, size: 11 });
  sh.setRowHeight(sh.getRange(a1).getRow(), 28);
}

function headerStyle_(rg) {
  rg.setBackground(COLOR.ink).setFontColor('#FFFFFF').setFontWeight('bold')
    .setWrap(true).setVerticalAlignment('middle');
}

function gridBorder_(rg) {
  rg.setBorder(true, true, true, true, true, true, COLOR.line, SpreadsheetApp.BorderStyle.SOLID);
}

function listRule_(values, help) {
  return SpreadsheetApp.newDataValidation().requireValueInList(values, true)
    .setAllowInvalid(false).setHelpText(help).build();
}

function trimSheet_(sh, rows, cols) {
  if (sh.getMaxColumns() > cols) sh.deleteColumns(cols + 1, sh.getMaxColumns() - cols);
  if (sh.getMaxRows() > rows) sh.deleteRows(rows + 1, sh.getMaxRows() - rows);
}

/* ---------- chạy ---------- */

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  for (let w = 1; w <= 8; w++) {
    const old = ss.getSheetByName('Tuần ' + w);
    if (old && old.getMaxRows() >= LAST) {
      const prices = old.getRange(FIRST, 7, LAST - FIRST + 1, 1).getValues();
      if (prices.some(r => r[0] !== '')) {
        throw new Error('Trang "Tuần ' + w + '" đã có giá. Script dừng để không xoá dữ liệu.');
      }
    }
  }

  // setupSheet dựng lại trang Tổng quan, nên không được chạy khi nhóm đã điền mặt hàng.
  const ovOld = ss.getSheetByName(OV);
  if (ovOld && ovOld.getMaxRows() >= POS.item0 + 12 && ovOld.getMaxColumns() >= 4) {
    const names = ovOld.getRange(POS.item0 + 1, 4, 12, 1).getValues();
    if (names.some(r => r[0] !== '')) {
      throw new Error('Trang "Tổng quan" đã có mặt hàng do nhóm điền. setupSheet chỉ dùng cho bảng trống, ' +
        'nên script dừng để không xoá dữ liệu.');
    }
  }

  // Công thức trong script dùng dấu phẩy ngăn tham số. Sheet ở định dạng Việt Nam đòi dấu chấm phẩy,
  // nên phải ghi công thức khi sheet đang ở định dạng Mỹ, rồi mới chuyển về Việt Nam ở cuối hàm.
  ss.setSpreadsheetLocale('en_US');
  ss.setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
  SpreadsheetApp.flush();

  // Giữ lại trang câu hỏi phỏng vấn nếu đã có, các trang khác dựng lại.
  const tmp = ss.insertSheet('_tam_' + Date.now());
  ss.getSheets().forEach(s => {
    if (s.getSheetId() !== tmp.getSheetId() && s.getName() !== INTERVIEW) ss.deleteSheet(s);
  });
  const ov = ss.insertSheet(OV, 0);
  const weeks = [];
  for (let w = 1; w <= 8; w++) weeks.push(ss.insertSheet('Tuần ' + w, w));
  ss.deleteSheet(tmp);

  for (let w = 1; w <= 8; w++) buildWeek_(weeks[w - 1], w);
  buildOverview_(ov);

  let iv = ss.getSheetByName(INTERVIEW);
  if (!iv) {
    iv = ss.insertSheet(INTERVIEW, 1);
    buildInterview_(iv);
  } else {
    ss.setActiveSheet(iv);
    ss.moveActiveSheet(2);   // đặt ngay sau trang Tổng quan
  }

  ss.setActiveSheet(ov);
  SpreadsheetApp.flush();
  ss.setSpreadsheetLocale('vi_VN');
  SpreadsheetApp.flush();
}

/* ---------- sửa lỗi #ERROR! ---------- */

// Viết lại mọi công thức khi sheet đang ở định dạng Mỹ, rồi chuyển về định dạng Việt Nam.
// Chỉ ghi vào các ô đang có công thức, nên dữ liệu nhóm đã nhập không bị đụng tới.
function fixFormulas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetLocale('en_US');
  SpreadsheetApp.flush();
  let count = 0;
  ss.getSheets().forEach(sh => {
    const rows = sh.getLastRow(), cols = sh.getLastColumn();
    if (!rows || !cols) return;
    const f = sh.getRange(1, 1, rows, cols).getFormulas();
    // Ghi theo từng đoạn ô công thức liền nhau trong một cột, để không ghi đè ô dữ liệu.
    for (let c = 0; c < cols; c++) {
      let r = 0;
      while (r < rows) {
        if (!f[r][c]) { r++; continue; }
        const start = r, run = [];
        while (r < rows && f[r][c]) { run.push([f[r][c]]); r++; }
        sh.getRange(start + 1, c + 1, run.length, 1).setFormulas(run);
        count += run.length;
      }
    }
  });
  SpreadsheetApp.flush();
  ss.setSpreadsheetLocale('vi_VN');
  SpreadsheetApp.flush();
  Logger.log('Đã viết lại ' + count + ' công thức.');
}

/* ---------- trang Câu hỏi phỏng vấn (M1) ---------- */

// 8 câu hỏi phỏng vấn, gộp từ 12 câu nhóm soạn (đánh số theo thứ tự danh sách 12 câu cũ).
// Mỗi câu hỏi về một lần cụ thể đã xảy ra, theo tinh thần sách The Mom Test.
const INTERVIEW_QUESTIONS = [
  ['Anh/chị kể em nghe lần gần nhất anh/chị đi mua đồ ăn cho cả nhà được không, từ lúc quyết định đi mua cho tới lúc về tới nhà?',
   'Mua ở đâu? Đi bằng gì? Mất bao lâu? Hết khoảng bao nhiêu?', 'Q4 · Rổ tuần\nQ1 · Kênh', '2, 3'],
  ['Tuần vừa rồi đồ ăn của nhà mình được mua ở những đâu? Món nào mua ở chỗ nào, và vì sao lại mua ở đó?',
   'Có chỗ nào trước đây hay mua mà giờ không mua nữa không? Vì sao?', 'Q4 · Rổ tuần', '5'],
  ['Lần gần nhất anh/chị thấy cùng một món mà chỗ này đắt hơn hẳn chỗ kia là khi nào? Lúc đó anh/chị đã mua ở đâu?',
   'Vì sao anh/chị chọn mua ở chỗ đó?', 'Q1 · Kênh', '5, 9'],
  ['Lần gần nhất anh/chị mua đồ ăn ở một quận khác, như gần chỗ làm hay nhà người thân, là khi nào? Hàng và giá ở đó khác gì chỗ gần nhà?',
   'Lần đó vì sao anh/chị mua ở đó?', 'Q2 · Quận', '6, 7'],
  ['Lần gần nhất anh/chị thấy đồ ăn mình hay mua bị lên giá là khi nào? Lúc đó anh/chị đã làm gì?',
   'Anh/chị nhận ra giá tăng bằng cách nào?', 'Q3 · CPI', '1'],
  ['Mấy tháng gần đây anh/chị có thay đổi gì trong cách mua đồ ăn để bớt tiền không? Lần thay đổi gần nhất là gì, và vì sao?',
   'Thay đổi đó bớt được khoảng bao nhiêu? Anh/chị có phải đánh đổi gì không?', 'Q1 · Kênh\nQ4 · Rổ tuần', '4, 8'],
  ['Lần gần nhất anh/chị chấp nhận mua đắt hơn để đỡ tốn thời gian hoặc công đi lại là khi nào? Hôm đó có chuyện gì?',
   'Lần đó anh/chị mua ở đâu? Đắt hơn khoảng bao nhiêu?', 'Q4 · Rổ tuần', '4, 10'],
  ['Lần gần nhất anh/chị mua đồ ăn về mà phải bỏ đi một phần, vì héo, hỏng hay phải cắt bỏ, là khi nào? Món đó mua ở đâu?',
   'Có phải hàng giảm giá không? Sau lần đó anh/chị có đổi chỗ mua không?', 'Q4 · Rổ tuần', '4, 11, 12'],
];

// Đổi trang "Câu hỏi phỏng vấn" từ 12 câu sang 8 câu mà không mất dữ liệu:
//   1. chép nguyên trang hiện tại thành tab "Câu hỏi phỏng vấn (12 câu cũ)";
//   2. đọc vai trò, ô đồng ý và ghi chú trả lời cũ;
//   3. dọn trang hiện tại và dựng 8 câu ngay trên trang đó (giữ tên và đường link của trang);
//   4. ghi lại vai trò, ô đồng ý, và chuyển ghi chú trả lời cũ sang câu mới tương ứng.
function replaceInterviewQuestions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(INTERVIEW);
  if (!sh) throw new Error('Không tìm thấy trang "' + INTERVIEW + '".');
  const rows = sh.getLastRow(), cols = Math.max(sh.getLastColumn(), 1);
  const head = sh.getRange(5, 1, 1, cols).getValues()[0].map(String);
  if (head.some(h => h.indexOf('Gộp từ câu') === 0)) {
    throw new Error('Trang "' + INTERVIEW + '" đã là bản 8 câu, không cần chạy lại.');
  }

  // 1. Sao lưu nguyên trang cũ, đặt ngay sau trang hiện tại
  let backupName = INTERVIEW + ' (12 câu cũ)';
  if (ss.getSheetByName(backupName)) {
    backupName += ' ' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd HHmm');
  }
  const backup = sh.copyTo(ss).setName(backupName);
  ss.setActiveSheet(backup);
  ss.moveActiveSheet(sh.getIndex() + 1);
  SpreadsheetApp.flush();

  // 2. Đọc phần nhóm đã nhập
  const role = sh.getRange('C2').getValue();
  const consent = sh.getRange('E2').getValue() === true;
  const ansCol = head.findIndex(h => /câu trả lời/i.test(h));
  const oldAnswers = {};
  if (ansCol >= 0 && rows >= 6) {
    sh.getRange(6, 1, rows - 5, cols).getValues().forEach(r => {
      const num = Number(r[0]), ans = r[ansCol];
      if (num && ans !== '' && ans !== null && ans !== false) oldAnswers[num] = String(ans);
    });
  }

  // 3. Dọn trang hiện tại (đã có bản sao) và dựng 8 câu
  ss.setSpreadsheetLocale('en_US');
  SpreadsheetApp.flush();
  sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(p => p.remove());
  const all = sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns());
  all.breakApart();
  all.clearDataValidations();
  all.clear();
  sh.clearConditionalFormatRules();
  sh.setFrozenRows(0);
  if (sh.getMaxColumns() < 6) sh.insertColumnsAfter(sh.getMaxColumns(), 6 - sh.getMaxColumns());
  buildInterview_(sh);

  // 4. Ghi lại phần nhóm đã nhập
  if (role) sh.getRange('C2').setValue(role);
  if (consent) sh.getRange('E2').setValue(true);
  const first = 6, n = INTERVIEW_QUESTIONS.length;
  const target = {};   // câu cũ → câu mới đầu tiên có gộp câu cũ đó
  INTERVIEW_QUESTIONS.forEach((q, k) => q[3].split(',').map(x => Number(x.trim())).forEach(o => {
    if (!(o in target)) target[o] = k;
  }));
  const carried = INTERVIEW_QUESTIONS.map(() => []);
  const leftover = [];
  Object.keys(oldAnswers).map(Number).sort((a, b) => a - b).forEach(o => {
    const line = '(câu cũ ' + o + ') ' + oldAnswers[o];
    if (o in target) carried[target[o]].push(line); else leftover.push(line);
  });
  carried.forEach((lines, k) => { if (lines.length) sh.getRange(first + k, 6).setValue(lines.join('\n')); });
  if (leftover.length) {
    const r = first + n + 3;
    put_(sh, `A${r}:F${r}`, 'Ghi chú trả lời của câu cũ không còn trong 8 câu: ' + leftover.join(' · '),
      { wrap: true, fg: COLOR.ink2 });
  }

  ss.setActiveSheet(sh);
  SpreadsheetApp.flush();
  ss.setSpreadsheetLocale('vi_VN');
  SpreadsheetApp.flush();
}

function buildInterview_(sh) {
  const first = 6, n = INTERVIEW_QUESTIONS.length, last = first + n - 1;
  sh.setTabColor(COLOR.green);
  sh.setHiddenGridlines(true);
  trimSheet_(sh, last + 4, 6);
  sh.getRange(1, 1, last + 4, 6).setFontFamily('Roboto').setFontSize(10).setVerticalAlignment('middle');
  [40, 380, 300, 120, 90, 380].forEach((px, i) => sh.setColumnWidth(i + 1, px));

  // Dòng 1: tiêu đề và số câu đã ghi câu trả lời
  sh.getRange('A1:F1').setBackground(COLOR.green).setFontColor('#FFFFFF').setFontWeight('bold');
  put_(sh, 'A1:F1', `="CÂU HỎI PHỎNG VẤN · M1   ·   ${n} câu   ·   Đã ghi câu trả lời "&COUNTA(F${first}:F${last})&" / ${n}"`, { size: 14 });
  sh.setRowHeight(1, 40);

  // Dòng 2: thông tin buổi phỏng vấn (không ghi tên người được phỏng vấn)
  sh.getRange('A2:F2').setBackground(COLOR.bg);
  put_(sh, 'A2:B2', 'Người được phỏng vấn là', { fg: COLOR.ink2, align: 'right' });
  put_(sh, 'C2', null, { bg: COLOR.input });
  sh.getRange('C2').setDataValidation(listRule_(['Người bán ở chợ', 'Nhân viên siêu thị', 'Người đi chợ cho gia đình'],
    'Chọn vai trò. Không ghi tên người được phỏng vấn.'));
  put_(sh, 'D2', 'Đã xin đồng ý (consent)', { fg: COLOR.ink2, align: 'right' });
  sh.getRange('E2').insertCheckboxes().setBackground(COLOR.input).setHorizontalAlignment('left');
  sh.setRowHeight(2, 30);

  // Dòng 3: hướng dẫn
  put_(sh, 'A3:F3', 'Hỏi lần lượt từ câu 1 đến câu 8. Mỗi câu hỏi về một lần cụ thể đã xảy ra, nên hãy để người được phỏng vấn kể, ' +
    'đừng gợi ý câu trả lời. Khi họ dừng, dùng câu ở cột “Hỏi tiếp”. Ghi câu trả lời vào cột cuối. ' +
    'Buổi phỏng vấn cần ít nhất 20 phút.', { wrap: true, bg: COLOR.bg, fg: COLOR.ink2 });
  sh.setRowHeight(3, 48);
  sh.setRowHeight(4, 8);

  // Dòng 5: tiêu đề cột
  sh.getRange(5, 1, 1, 6).setValues([['#', 'Câu hỏi', 'Hỏi tiếp khi họ dừng', 'Câu hỏi con', 'Gộp từ câu (số # ở tab 12 câu cũ)',
    '✎ Ghi chú câu trả lời']]);
  headerStyle_(sh.getRange(5, 1, 1, 6));
  sh.setRowHeight(5, 40);

  // 8 câu hỏi, có sẵn; nhóm chỉ ghi câu trả lời ở cột cuối
  const rows = INTERVIEW_QUESTIONS.map((q, k) => [k + 1, q[0], q[1], q[2], q[3]]);
  const bgs = INTERVIEW_QUESTIONS.map((q, k) => {
    const band = k % 2 === 0 ? '#FFFFFF' : COLOR.band;
    return [band, band, band, band, band, COLOR.input];
  });
  sh.getRange(first, 1, n, 5).setValues(rows);
  sh.getRange(first, 1, n, 6).setBackgrounds(bgs).setWrap(true).setVerticalAlignment('top');
  sh.getRange(first, 1, n, 1).setHorizontalAlignment('center').setFontColor(COLOR.ink2).setFontWeight('bold');
  sh.getRange(first, 2, n, 1).setFontWeight('bold');
  sh.getRange(first, 3, n, 1).setFontColor(COLOR.ink2);
  sh.getRange(first, 4, n, 2).setFontColor(COLOR.ink2).setHorizontalAlignment('center');
  sh.getRange(first, 6, n, 1).setNumberFormat('@');
  sh.setRowHeights(first, n, 72);

  gridBorder_(sh.getRange(5, 1, n + 1, 6));

  // Câu chốt, không bắt buộc
  put_(sh, `A${last + 2}:F${last + 2}`, 'Câu chốt (không bắt buộc): “Có điều gì về chuyện đi chợ mà em chưa hỏi nhưng anh/chị thấy ' +
    'quan trọng không?” Câu này hay mở ra những chuyện cả nhóm không nghĩ tới.', { wrap: true, fg: COLOR.ink2 });
  sh.setRowHeight(last + 2, 36);

  ['A1:F1', 'A5:F5', `A${first}:E${last}`].forEach(a1 =>
    sh.getRange(a1).protect().setDescription('Ô có sẵn, không cần sửa').setWarningOnly(true));
  sh.setFrozenRows(5);
}

/* ---------- trang Tuần ---------- */

function buildWeek_(sh, w) {
  const color = appColor(w);
  const n = LAST - FIRST + 1;
  sh.setTabColor(color);
  sh.setHiddenGridlines(true);
  trimSheet_(sh, 80, NCOL + 1);
  sh.getRange(1, 1, 80, NCOL + 1).setFontFamily('Roboto').setFontSize(10).setVerticalAlignment('middle');

  const widths = [160, 80, 80, 160, 95, 55, 100, 75, 70, 85, 95, 90, 170, 160, 180, 110, 120];
  widths.forEach((px, i) => sh.setColumnWidth(i + 1, px));

  // Dòng 1: tiêu đề. Cột A được cố định nên không gộp ô vắt qua cột A.
  sh.getRange('A1:P1').setBackground(color).setFontColor('#FFFFFF').setFontWeight('bold');
  put_(sh, 'A1', `TUẦN ${w}`, { size: 16 });
  put_(sh, 'B1:P1', `="App tuần này: "&${OVR}${appCell(w)}&"   ·   Mỗi người 2 mặt hàng × 3 kênh × 2 quận = 12 giá"`, { size: 12 });
  sh.setRowHeight(1, 40);

  // Dòng 2: ngày đi thu và tiến độ
  sh.getRange('A2:P2').setBackground(COLOR.bg);
  put_(sh, 'A2', 'Ngày đi thu', { fg: COLOR.ink2 });
  put_(sh, 'B2:C2', null, { bg: COLOR.input });
  put_(sh, 'D2', 'Đã nhập', { fg: COLOR.ink2, align: 'right' });
  put_(sh, 'E2', `=COUNT(G${FIRST}:G${LAST})&" / 72"`, { bold: true });
  put_(sh, 'F2:H2', `=SPARKLINE(COUNT(G${FIRST}:G${LAST}),{"charttype","bar";"max",72;"color1","${color}"})`);
  put_(sh, 'I2', 'Đủ', { fg: COLOR.ink2, align: 'right' });
  put_(sh, 'J2', `=COUNTIF(P${FIRST}:P${LAST},"Đủ")`, { bold: true });
  put_(sh, 'K2', 'Hết hàng', { fg: COLOR.ink2, align: 'right' });
  put_(sh, 'L2', `=COUNTIF(P${FIRST}:P${LAST},"Hết hàng")`, { bold: true });
  put_(sh, 'M2', 'Cần sửa', { fg: COLOR.ink2, align: 'right' });
  put_(sh, 'N2', `=COUNTIF(P${FIRST}:P${LAST},"Sai đơn vị")+COUNTIF(P${FIRST}:P${LAST},"Thiếu số lượng")`, { bold: true });
  sh.setRowHeight(2, 30);

  // Dòng 3: hướng dẫn
  put_(sh, 'A3', 'Hướng dẫn', { bold: true, bg: COLOR.bg });
  put_(sh, 'B3:P3',
    'Tìm 12 dòng có tên bạn ở cột “Người được giao” (2 mặt hàng × 3 kênh × 2 quận) và điền các ô màu vàng. ' +
    'Ghi giá đúng như bảng giá, kèm số lượng và đơn vị, ví dụ 500 và g. Cột Ảnh không bắt buộc. ' +
    'Nếu người khác đi thay, chọn tên người đó ở cột “Người thu thực tế”. Cột “Trạng thái” tự báo dòng còn thiếu gì.',
    { wrap: true, bg: COLOR.bg, fg: COLOR.ink2 });
  sh.setRowHeight(3, 52);
  sh.setRowHeight(4, 8);

  // Dòng 5: tiêu đề cột
  const headers = ['Mặt hàng', 'Kênh', 'Quận', 'Người được giao', '✎ Ngày thu', '✎ Giờ',
    '✎ Giá (₫)', '✎ Số lượng', '✎ Đơn vị', '✎ Khuyến mãi', '✎ Tình trạng', '✎ Phí giao (chỉ app)',
    '✎ Ảnh (không bắt buộc)', '✎ Người thu thực tế (nếu khác)', '✎ Ghi chú', 'Trạng thái', 'Người thu (tự tính)'];
  sh.getRange(5, 1, 1, NCOL + 1).setValues([headers]);
  headerStyle_(sh.getRange(5, 1, 1, NCOL + 1));
  sh.setRowHeight(5, 46);

  // Dữ liệu: 6 người × 2 mặt hàng × 3 kênh × 2 quận
  const fA = [], fB = [], fC = [], vD = [], fP = [], fQ = [];
  const bgs = [], fgs = [];
  SCHEDULE[w - 1].forEach((pair, i) => {
    pair.forEach(item => {
      CHANNELS.forEach((ch, c) => {
        [0, 1].forEach(d => {
          const r = FIRST + fA.length;
          const ir = POS.item0 + item;
          const std = `${OVR}$H$${ir}`;   // đơn vị chuẩn của mặt hàng, ghi ở trang Tổng quan
          fA.push([`=IF(${OVR}$D$${ir}="","${code(item)}","${code(item)} · "&${OVR}$D$${ir})`]);
          fB.push([ch === 'App' ? `=${OVR}${appCell(w)}` : `="${ch}"`]);
          fC.push([`=${OVR}${d === 0 ? POS.distA : POS.distB}`]);
          vD.push([MEMBERS[i]]);
          fP.push([`=IF(K${r}="Hết hàng","Hết hàng",IF(G${r}="","Chưa nhập",IF(OR(H${r}="",I${r}=""),"Thiếu số lượng",` +
            `IF(AND(${std}<>"",IF(OR(I${r}="g",I${r}="kg"),"kg",IF(OR(I${r}="ml",I${r}="lít"),"lít","cái"))<>${std}),"Sai đơn vị","Đủ"))))`]);
          fQ.push([`=IF(N${r}="",D${r},N${r})`]);

          const band = i % 2 === 0 ? '#FFFFFF' : COLOR.band;
          const rowBg = [], rowFg = [];
          for (let col = 1; col <= NCOL + 1; col++) {
            let b = '#FFFFFF', f = COLOR.ink;
            if (col === 1 || col === 3 || col === 4) b = band;
            else if (col === 2) { b = CH_COLOR[ch][0]; f = CH_COLOR[ch][1]; }
            else if (col === 12) b = ch === 'App' ? COLOR.input : COLOR.empty;
            else if ([5, 6, 7, 8, 9, 10, 11, 13, 14, 15].indexOf(col) >= 0) b = COLOR.input;
            rowBg.push(b); rowFg.push(f);
          }
          bgs.push(rowBg); fgs.push(rowFg);
        });
      });
    });
  });

  sh.getRange(FIRST, 1, n, 1).setFormulas(fA);
  sh.getRange(FIRST, 2, n, 1).setFormulas(fB);
  sh.getRange(FIRST, 3, n, 1).setFormulas(fC);
  sh.getRange(FIRST, 4, n, 1).setValues(vD);
  sh.getRange(FIRST, 16, n, 1).setFormulas(fP);
  sh.getRange(FIRST, 17, n, 1).setFormulas(fQ);
  sh.getRange(FIRST, 1, n, NCOL + 1).setBackgrounds(bgs).setFontColors(fgs);
  sh.setRowHeights(FIRST, n, 26);

  // Định dạng số và cột
  sh.getRange(FIRST, 5, n, 1).setNumberFormat('dd/mm/yyyy');
  [7, 12].forEach(col => sh.getRange(FIRST, col, n, 1).setNumberFormat('#,##0'));
  sh.getRange(FIRST, 1, n, 1).setFontWeight('bold');
  sh.getRange(FIRST, 2, n, 1).setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange(FIRST, 7, n, 1).setFontWeight('bold');
  sh.getRange(FIRST, 16, n, 1).setFontWeight('bold').setHorizontalAlignment('center');

  // Kiểm tra dữ liệu nhập
  const num = help => SpreadsheetApp.newDataValidation().requireNumberGreaterThan(0)
    .setAllowInvalid(false).setHelpText(help).build();
  sh.getRange(FIRST, 5, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireDate()
    .setAllowInvalid(false).setHelpText('Chọn ngày đi thu').build());
  sh.getRange(FIRST, 7, n, 1).setDataValidation(num('Nhập số, ví dụ 45000. Không ghi "k" hay "đ".'));
  sh.getRange(FIRST, 8, n, 1).setDataValidation(num('Nhập số lượng, ví dụ 500'));
  sh.getRange(FIRST, 9, n, 1).setDataValidation(listRule_(['g', 'kg', 'ml', 'lít', 'cái'], 'Chọn đơn vị'));
  sh.getRange(FIRST, 10, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  sh.getRange(FIRST, 11, n, 1).setDataValidation(listRule_(['Còn hàng', 'Hết hàng'], 'Chọn tình trạng hàng'));
  sh.getRange(FIRST, 14, n, 1).setDataValidation(listRule_(MEMBERS, 'Chỉ chọn khi người khác đi thu thay'));
  for (let r = FIRST; r <= LAST; r++) {
    if ((r - FIRST) % 6 >= 4) {   // 2 dòng cuối của mỗi mặt hàng là kênh App
      sh.getRange(r, 12).setDataValidation(SpreadsheetApp.newDataValidation()
        .requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false)
        .setHelpText('Phí giao và phí dịch vụ của app, nhập 0 nếu miễn phí').build());
    }
  }

  // Viền: lưới mảnh, viền đậm giữa các người, nét đứt giữa hai mặt hàng
  gridBorder_(sh.getRange(5, 1, n + 1, NCOL));
  for (let i = 0; i < 6; i++) {
    sh.getRange(FIRST + i * 12, 1, 1, NCOL).setBorder(true, null, null, null, null, null,
      COLOR.ink2, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sh.getRange(FIRST + i * 12 + 6, 1, 1, NCOL).setBorder(true, null, null, null, null, null,
      COLOR.ink2, SpreadsheetApp.BorderStyle.DASHED);
  }

  // Tô màu cột Trạng thái
  const st = sh.getRange(FIRST, 16, n, 1);
  sh.setConditionalFormatRules(STATUS.map(s => SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(s[0]).setBackground(s[1]).setFontColor(s[2]).setRanges([st]).build()));

  // Khoá mềm các cột tự tính (sửa vẫn được nhưng có cảnh báo)
  ['A1:Q1', 'D2:Q2', 'A3:Q5', `A${FIRST}:D${LAST}`, `P${FIRST}:Q${LAST}`].forEach(a1 =>
    sh.getRange(a1).protect().setDescription('Ô tự tính, không cần sửa').setWarningOnly(true));

  sh.setFrozenRows(5);
  sh.setFrozenColumns(1);
  sh.getRange(5, 1, n + 1, NCOL).createFilter();
  sh.hideColumns(NCOL + 1);
}

/* ---------- trang Tổng quan ---------- */

function buildOverview_(sh) {
  sh.setTabColor(COLOR.ink);
  sh.setHiddenGridlines(true);
  trimSheet_(sh, 140, 24);
  sh.getRange(1, 1, 140, 24).setFontFamily('Roboto').setFontSize(10)
    .setVerticalAlignment('middle').setFontColor(COLOR.ink);
  const widths = { 1: 16, 2: 64, 3: 190, 4: 150, 5: 110, 6: 110, 15: 16, 24: 16 };
  for (let c = 7; c <= 14; c++) widths[c] = 104;
  for (let c = 16; c <= 23; c++) widths[c] = 70;
  Object.keys(widths).forEach(c => sh.setColumnWidth(+c, widths[c]));

  // Tiêu đề
  put_(sh, 'B1:N1', 'P10 · The Price of Dinner — Bảng thu giá', { size: 20, bold: true });
  sh.setRowHeight(1, 46);
  put_(sh, 'B2:N2', '12 mặt hàng × 3 kênh × 2 quận × 8 tuần = 576 giá. Đề yêu cầu ít nhất 500 giá.',
    { fg: COLOR.ink2 });
  put_(sh, 'B3:N3', 'Cách dùng: (1) Mỗi người điền 2 mặt hàng của mình ở mục ③. (2) Mỗi tuần, mở trang “Tuần n”, tìm các dòng có tên mình ' +
    'ở cột “Người được giao” và điền các ô màu vàng. (3) Trang này tự cập nhật, không cần sửa.', { fg: COLOR.ink2, wrap: true });
  sh.setRowHeight(3, 34);

  // ① Tiến độ chung
  section_(sh, 'B5:N5', '①  Tiến độ chung');
  const kpis = [
    ['B6:C6', 'B7:C7', 'Giá đã nhập', `=SUM(D${POS.week0 + 1}:D${POS.week0 + 8})`, '0'],
    ['D6:E6', 'D7:E7', 'Mục tiêu của đề', 500, '0'],
    ['F6:G6', 'F7:G7', 'Còn thiếu', '=MAX(0,D7-B7)', '0'],
    ['H6:I6', 'H7:I7', 'Tỷ lệ trên 576 giá', '=B7/576', '0.0%'],
  ];
  kpis.forEach(k => {
    put_(sh, k[0], k[2], { fg: COLOR.ink2, bg: COLOR.bg });
    put_(sh, k[1], k[3], { fmt: k[4], size: 22, bold: true, fg: COLOR.green, bg: COLOR.bg, align: 'left' });
  });
  put_(sh, 'J6:N6', 'Tiến độ đến mục tiêu 500 giá', { fg: COLOR.ink2, bg: COLOR.bg });
  put_(sh, 'J7:N7', `=SPARKLINE(B7,{"charttype","bar";"max",500;"color1","${COLOR.green}"})`, { bg: COLOR.bg });
  sh.setRowHeight(6, 22);
  sh.setRowHeight(7, 46);

  // ② Cài đặt
  section_(sh, 'B9:N9', '②  Cài đặt · đổi tên ở ô màu vàng, các trang Tuần tự đổi theo');
  [['B10:C10', 'Tên quận A', 'D10', 'Quận A'], ['B11:C11', 'Tên quận B', 'D11', 'Quận B'],
   ['F10:G10', 'App tuần lẻ (1, 3, 5, 7)', 'H10:I10', 'Grab Mart'],
   ['F11:G11', 'App tuần chẵn (2, 4, 6, 8)', 'H11:I11', 'Shopee Mart']].forEach(s => {
    put_(sh, s[0], s[1], { fg: COLOR.ink2 });
    put_(sh, s[2], s[3], { bg: COLOR.input, bold: true });
    gridBorder_(sh.getRange(s[2]));
  });
  sh.setRowHeights(10, 2, 26);

  // ③ 12 mặt hàng
  section_(sh, 'B13:N13', '③  12 mặt hàng · mỗi người chọn 2 mặt hàng và điền các ô màu vàng');
  sh.getRange('B14:H14').setValues([['Mã', 'Người chọn', '✎ Tên mặt hàng', '✎ Nhóm', '✎ Thương hiệu / loại',
    '✎ Quy cách mua', '✎ Đơn vị chuẩn']]);
  put_(sh, 'I14:N14', '✎ Ghi chú chất lượng (độ tươi, loại, cách nhận biết)');
  headerStyle_(sh.getRange('B14:N14'));
  sh.setRowHeight(14, 34);
  for (let n = 1; n <= 12; n++) {
    const r = POS.item0 + n;
    sh.getRange(r, 2, 1, 2).setValues([[code(n), MEMBERS[Math.floor((n - 1) / 2)]]]);
    sh.getRange(r, 9, 1, 6).merge();
  }
  const items = sh.getRange('B15:N26');
  sh.getRangeList(['D15:H26', 'I15:N26']).setBackground(COLOR.input);
  sh.getRange('B15:B26').setFontWeight('bold').setFontColor(COLOR.green);
  sh.getRange('C15:C26').setFontWeight('bold');
  sh.getRange('E15:E26').setDataValidation(listRule_(['Tinh bột', 'Đạm', 'Rau củ quả', 'Dầu và đường', 'Khác'], 'Chọn nhóm hàng'));
  sh.getRange('H15:H26').setDataValidation(listRule_(['kg', 'lít', 'cái'],
    'Đơn vị để so giá: kg cho hàng cân, lít cho chất lỏng, cái cho quả, gói, miếng'));
  gridBorder_(items);
  for (let k = 0; k < 6; k++) {
    sh.getRange(16 + 2 * k, 2, 1, 13).setBorder(null, null, true, null, null, null,
      COLOR.ink2, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  }
  sh.setRowHeights(15, 12, 24);

  // ④ Phân công
  section_(sh, 'B28:N28', '④  Phân công mỗi tuần · xếp ngẫu nhiên một lần, đã cố định');
  sh.getRange('B29:C29').setValues([['#', 'Người']]);
  put_(sh, 'D29:F29', 'Mặt hàng tự chọn');
  headerStyle_(sh.getRange('B29:N29'));
  for (let w = 1; w <= 8; w++) {
    const h = sh.getRange(POS.sched0, 6 + w);
    h.setFormula(`="Tuần ${w}"&CHAR(10)&${appCell(w)}`);
    h.setBackground(appColor(w)).setHorizontalAlignment('center');
  }
  sh.setRowHeight(POS.sched0, 40);
  for (let i = 0; i < 6; i++) {
    const r = POS.sched0 + 1 + i;
    sh.getRange(r, 2, 1, 2).setValues([[i + 1, MEMBERS[i]]]);
    put_(sh, `D${r}:F${r}`, `=${itemName(2 * i + 1, '')}&"  ·  "&${itemName(2 * i + 2, '')}`, { fg: COLOR.ink2 });
    for (let w = 1; w <= 8; w++) {
      const [p, q] = SCHEDULE[w - 1][i];
      sh.getRange(r, 6 + w).setFormula(`=${itemName(p, '')}&CHAR(10)&${itemName(q, '')}`)
        .setBackground(w % 2 === 1 ? COLOR.grabTint : COLOR.shopeeTint);
    }
  }
  const sched = sh.getRange(POS.sched0 + 1, 7, 6, 8);
  sched.setWrap(true).setHorizontalAlignment('center').setFontSize(9);
  sh.getRange(POS.sched0 + 1, 3, 6, 1).setFontWeight('bold');
  gridBorder_(sh.getRange(POS.sched0, 2, 7, 13));
  sh.setRowHeights(POS.sched0 + 1, 6, 40);
  put_(sh, 'B36:N36', 'Trong 6 tuần đầu, mỗi người đi đủ 12 mặt hàng và không lặp lại. Không ai làm lại mặt hàng của tuần liền trước, ' +
    'và không cặp mặt hàng nào lặp lại trong 8 tuần.', { fg: COLOR.ink2, wrap: true });
  sh.setRowHeight(36, 30);

  // ⑤ Tiến độ theo tuần
  section_(sh, 'B38:N38', '⑤  Tiến độ theo tuần');
  sh.getRange('B39:G39').setValues([['Tuần', 'App', 'Đã nhập', 'Đủ', 'Hết hàng', 'Cần sửa']]);
  put_(sh, 'H39:N39', 'Tiến độ trên 72 giá');
  headerStyle_(sh.getRange('B39:N39'));
  sh.setRowHeight(39, 34);
  for (let w = 1; w <= 8; w++) {
    const r = POS.week0 + w, W = weekRef(w), P = `${W}$P$${FIRST}:$P$${LAST}`;
    sh.getRange(r, 2).setValue('Tuần ' + w);
    sh.getRange(r, 3, 1, 5).setFormulas([[
      `=${appCell(w)}`,
      `=COUNT(${W}$G$${FIRST}:$G$${LAST})`,
      `=COUNTIF(${P},"Đủ")`,
      `=COUNTIF(${P},"Hết hàng")`,
      `=COUNTIF(${P},"Sai đơn vị")+COUNTIF(${P},"Thiếu số lượng")`,
    ]]);
    sh.getRange(r, 3).setFontColor(appColor(w)).setFontWeight('bold');
    put_(sh, `H${r}:N${r}`, `=SPARKLINE(D${r},{"charttype","bar";"max",72;"color1","${appColor(w)}"})`);
  }
  sh.getRange(POS.week0 + 1, 4, 8, 1).setFontWeight('bold');
  gridBorder_(sh.getRange(POS.week0, 2, 9, 13));
  sh.setRowHeights(POS.week0 + 1, 8, 26);

  // ⑥ Tiến độ theo người
  section_(sh, 'B49:N49', '⑥  Tiến độ theo người');
  sh.getRange('B50:F50').setValues([['#', 'Người', 'Giá đã nhập', '% trên 576', 'Cần sửa']]);
  put_(sh, 'G50:N50', 'Tiến độ trên 96 giá (mức chia đều cho 6 người)');
  headerStyle_(sh.getRange('B50:N50'));
  sh.setRowHeight(50, 34);
  const sumWeeks = f => '=' + [1, 2, 3, 4, 5, 6, 7, 8].map(f).join('+');
  for (let i = 0; i < 6; i++) {
    const r = POS.member0 + 1 + i;
    const Q = w => `${weekRef(w)}$Q$${FIRST}:$Q$${LAST}`;
    const G = w => `${weekRef(w)}$G$${FIRST}:$G$${LAST}`;
    const P = w => `${weekRef(w)}$P$${FIRST}:$P$${LAST}`;
    sh.getRange(r, 2, 1, 2).setValues([[i + 1, MEMBERS[i]]]);
    sh.getRange(r, 4, 1, 3).setFormulas([[
      sumWeeks(w => `COUNTIFS(${Q(w)},$C${r},${G(w)},"<>")`),
      `=D${r}/576`,
      sumWeeks(w => `COUNTIFS(${Q(w)},$C${r},${P(w)},"Sai đơn vị")+COUNTIFS(${Q(w)},$C${r},${P(w)},"Thiếu số lượng")`),
    ]]);
    put_(sh, `G${r}:N${r}`, `=SPARKLINE(D${r},{"charttype","bar";"max",96;"color1","#004B7A"})`);
  }
  sh.getRange(POS.member0 + 1, 5, 6, 1).setNumberFormat('0.0%');
  sh.getRange(POS.member0 + 1, 3, 6, 2).setFontWeight('bold');
  gridBorder_(sh.getRange(POS.member0, 2, 7, 13));
  sh.setRowHeights(POS.member0 + 1, 6, 26);
  put_(sh, 'B57:N57', 'Đề yêu cầu tên mỗi người xuất hiện ở ít nhất 20% số giá. Với 6 người, mức chia đều chỉ khoảng 16,7% (96 giá), ' +
    'nên nhóm cần hỏi giảng viên.', { fg: '#BE3B25', wrap: true });
  sh.setRowHeight(57, 30);

  // ⑦ Bảng giá đầy đủ và ⑧ chỉ số
  section_(sh, 'B59:N59', '⑦  Bảng giá đầy đủ · giá quy về đơn vị chuẩn (₫/kg, ₫/lít, ₫/cái), tự tính từ 8 trang Tuần');
  section_(sh, 'P59:W59', '⑧  Chỉ số giá · tuần đầu = 100');
  const hdr = ['Mã', 'Mặt hàng', 'Kênh', 'Quận', 'Đơn vị'];
  for (let w = 1; w <= 8; w++) hdr.push('T' + w);
  sh.getRange(POS.full0, 2, 1, 13).setValues([hdr]);
  sh.getRange(POS.full0, 16, 1, 8).setValues([[1, 2, 3, 4, 5, 6, 7, 8].map(w => 'T' + w)]);
  headerStyle_(sh.getRange(POS.full0, 2, 1, 13));
  headerStyle_(sh.getRange(POS.full0, 16, 1, 8));
  sh.getRange(POS.full0, 7, 1, 8).setHorizontalAlignment('center');
  sh.getRange(POS.full0, 16, 1, 8).setHorizontalAlignment('center');

  const left = [], prices = [], idx = [], bgs = [], fgs = [];
  for (let n = 1; n <= 12; n++) {
    CHANNELS.forEach((ch, c) => {
      [0, 1].forEach(d => {
        const r = POS.full0 + 1 + left.length;
        left.push([`="${code(n)}"`, `=${itemName(n, '')}`, `="${ch}"`,
          `=${d === 0 ? POS.distA : POS.distB}`, `=IF($H$${POS.item0 + n}="","",$H$${POS.item0 + n})`]);
        const pr = [], ix = [];
        for (let w = 1; w <= 8; w++) {
          // Giá quy đổi: giá ÷ (số lượng × hệ số), với g và ml đổi sang kg và lít.
          const wr = weekRow_(w, n, c, d), W = weekRef(w);
          const g = `${W}$G$${wr}`, q = `${W}$H$${wr}`, u = `${W}$I$${wr}`;
          pr.push(`=IF(OR(${g}="",${q}="",${u}=""),"",IFERROR(${g}/(${q}*IF(OR(${u}="g",${u}="ml"),0.001,1)),""))`);
          const col = colLetter(6 + w);
          const base = ch === 'App' && w % 2 === 0 ? 'H' : 'G';
          ix.push(`=IF(OR(${base}${r}="",${col}${r}=""),"",${col}${r}/${base}${r}*100)`);
        }
        prices.push(pr); idx.push(ix);
        const band = n % 2 === 1 ? '#FFFFFF' : COLOR.band;
        bgs.push([band, band, CH_COLOR[ch][0], band, band]);
        fgs.push([COLOR.green, COLOR.ink, CH_COLOR[ch][1], COLOR.ink2, COLOR.ink2]);
      });
    });
  }
  const R0 = POS.full0 + 1, NR = left.length;
  sh.getRange(R0, 2, NR, 5).setFormulas(left).setBackgrounds(bgs).setFontColors(fgs);
  sh.getRange(R0, 2, NR, 1).setFontWeight('bold');
  sh.getRange(R0, 4, NR, 1).setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange(R0, 7, NR, 8).setFormulas(prices).setNumberFormat('#,##0').setHorizontalAlignment('right');
  sh.getRange(R0, 16, NR, 8).setFormulas(idx).setNumberFormat('0.0').setHorizontalAlignment('center');
  gridBorder_(sh.getRange(POS.full0, 2, NR + 1, 13));
  gridBorder_(sh.getRange(POS.full0, 16, NR + 1, 8));
  for (let n = 1; n < 12; n++) {
    const r = R0 + n * 6;
    sh.getRange(r, 2, 1, 13).setBorder(true, null, null, null, null, null, COLOR.ink2, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sh.getRange(r, 16, 1, 8).setBorder(true, null, null, null, null, null, COLOR.ink2, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  }
  sh.setRowHeights(R0, NR, 22);
  put_(sh, `B${R0 + NR + 1}:W${R0 + NR + 1}`, 'Ô xám là chưa có giá. Ví dụ: 500 g giá 25.000 ₫ thành 50.000 ₫/kg. ' +
    'App đổi giữa hai app theo tuần, nên chỉ số của App so với tuần đầu của cùng app: tuần lẻ so với tuần 1, tuần chẵn so với tuần 2.',
    { fg: COLOR.ink2, wrap: true });
  sh.setRowHeight(R0 + NR + 1, 30);

  // Chú thích màu
  section_(sh, 'P13:W13', 'Chú thích màu');
  put_(sh, 'P14:Q14', '✎', { bg: COLOR.input, align: 'center', bold: true });
  put_(sh, 'R14:W14', 'Ô màu vàng là ô cần điền', { fg: COLOR.ink2 });
  [['Chợ', 'Chợ truyền thống'], ['Siêu thị', 'Siêu thị'],
   ['App', 'App giao hàng: tuần lẻ app 1, tuần chẵn app 2']].forEach((c, k) => {
    put_(sh, `P${15 + k}:Q${15 + k}`, c[0], { bg: CH_COLOR[c[0]][0], fg: CH_COLOR[c[0]][1], bold: true, align: 'center' });
    put_(sh, `R${15 + k}:W${15 + k}`, c[1], { fg: COLOR.ink2 });
  });
  put_(sh, 'P18', 85, { bg: '#5AAE61', align: 'center', bold: true });
  put_(sh, 'Q18', 100, { bg: '#FFFFFF', align: 'center', bold: true });
  put_(sh, 'R18', 115, { bg: '#9970AB', align: 'center', bold: true });
  put_(sh, 'S18:W18', 'Chỉ số: xanh là rẻ hơn tuần đầu, tím là đắt hơn', { fg: COLOR.ink2 });
  STATUS.forEach((s, k) => {
    put_(sh, `P${19 + k}:Q${19 + k}`, s[0], { bg: s[1], fg: s[2], bold: true, align: 'center' });
    put_(sh, `R${19 + k}:W${19 + k}`, s[3], { fg: COLOR.ink2 });
  });
  gridBorder_(sh.getRange(`P14:Q${18 + STATUS.length}`));
  gridBorder_(sh.getRange('R18'));

  // Định dạng có điều kiện: ô giá trống tô xám, chỉ số tô màu quanh 100
  const priceRange = sh.getRange(R0, 7, NR, 8);
  const idxRange = sh.getRange(R0, 16, NR, 8);
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(`=G${R0}=""`)
      .setBackground(COLOR.empty).setRanges([priceRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .setGradientMinpointWithValue('#5AAE61', SpreadsheetApp.InterpolationType.NUMBER, '85')
      .setGradientMidpointWithValue('#FFFFFF', SpreadsheetApp.InterpolationType.NUMBER, '100')
      .setGradientMaxpointWithValue('#9970AB', SpreadsheetApp.InterpolationType.NUMBER, '115')
      .setRanges([idxRange]).build(),
  ]);

  // Biểu đồ
  sh.insertChart(sh.newChart().setChartType(Charts.ChartType.COLUMN)
    .addRange(sh.getRange(`B${POS.week0}:B${POS.week0 + 8}`))
    .addRange(sh.getRange(`D${POS.week0}:D${POS.week0 + 8}`))
    .setNumHeaders(1)
    .setPosition(38, 16, 0, 0)
    .setOption('title', 'Số giá đã nhập mỗi tuần (tối đa 72)')
    .setOption('legend', { position: 'none' })
    .setOption('colors', [COLOR.green])
    .setOption('width', 560).setOption('height', 250)
    .build());
  sh.insertChart(sh.newChart().setChartType(Charts.ChartType.BAR)
    .addRange(sh.getRange(`C${POS.member0}:C${POS.member0 + 6}`))
    .addRange(sh.getRange(`D${POS.member0}:D${POS.member0 + 6}`))
    .setNumHeaders(1)
    .setPosition(49, 16, 0, 0)
    .setOption('title', 'Số giá mỗi người đã nhập (chia đều: 96)')
    .setOption('legend', { position: 'none' })
    .setOption('colors', ['#004B7A'])
    .setOption('width', 560).setOption('height', 240)
    .build());

  // Khoá mềm các vùng tự tính trên trang Tổng quan
  ['B1:N7', 'B14:C26', `B${POS.sched0}:N${POS.sched0 + 6}`, `B${POS.week0}:N${POS.week0 + 8}`,
   `B${POS.member0}:N${POS.member0 + 6}`, `B${POS.full0}:W${POS.full0 + NR}`].forEach(a1 =>
    sh.getRange(a1).protect().setDescription('Ô tự tính, không cần sửa').setWarningOnly(true));
}
