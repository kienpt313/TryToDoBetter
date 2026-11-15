const TZ = "Asia/Ho_Chi_Minh";

/** Lịch tăng tốc từ 15/11/2026 · mục tiêu ≈5.5–6 giờ tập trung / ngày thường */

const WEEKDAY_BLOCKS = [
  {
    id: "morning",
    time: "05:30–07:15",
    start: "05:30",
    end: "07:15",
    name: "Sáng sớm · tiếng Anh (≈1h45)",
    tasks: [
      {
        id: "anki",
        title: "Anki 15 phút",
        desc: "Academic Word List + cụm graph / y sinh. Học cụm, không học từ rời.",
      },
      {
        id: "shadow",
        title: "Shadowing 20 phút",
        desc: "1 đoạn, lặp 3 lần. BBC 6 Minute English; từ tháng 4/2027 đổi talk khoa học.",
      },
      {
        id: "writing",
        title: "Writing 70 phút (không skip)",
        desc: "T2/T4/T6: IELTS Task 2 (lập dàn + viết + sửa 1 đoạn). T3/T5: paraphrase abstract paper rồi viết lại band cao hơn.",
      },
    ],
  },
  {
    id: "lunch",
    time: "12:20–13:00",
    start: "12:20",
    end: "13:00",
    name: "Trưa · input (40 phút)",
    tasks: [
      {
        id: "reading-snack",
        title: "Reading hoặc Listening 40 phút",
        desc: "T2/T4/T6: 1 đoạn Cambridge timed + paraphrase câu hỏi. T3/T5: 1 Listening section + chữa keyword.",
      },
    ],
  },
  {
    id: "listen",
    time: "18:00–18:45",
    start: "18:00",
    end: "18:45",
    name: "Chiều · nghe / nói (45 phút)",
    tasks: [
      {
        id: "listen-speak",
        title: "Listening hoặc Speaking 45 phút",
        desc: "T2/T4: dictation + chữa. T3/T5: ghi âm Speaking Part 2 × 2 + tự chấm. T6: Listening Section 3–4 hoặc Part 3 mock.",
      },
    ],
  },
  {
    id: "major",
    time: "19:00–20:50",
    start: "19:00",
    end: "20:50",
    name: "Tối · chuyên môn (≈1h50)",
    tasks: [
      {
        id: "major-110",
        title: "Khối Graph / y sinh theo thứ",
        desc: "T2 toán–graph nền. T3 code PyG / thí nghiệm. T4 y sinh + ethics/leakage. T5 1 paper graph-biomed (note tiếng Anh). T6 README tiếng Anh hoặc figure paper.",
      },
    ],
  },
  {
    id: "research",
    time: "21:00–21:50",
    start: "21:00",
    end: "21:50",
    name: "Nghiên cứu (50 phút)",
    tasks: [
      {
        id: "research-50",
        title: "Paper / Overleaf / thí nghiệm",
        desc: "T2 related work. T3 debug repo. T4 Method hoặc caption. T5 paper của lab Úc hoặc Nhật. T6 CV / bảng GS / nháp email (từ 6/2027 làm thật).",
      },
    ],
  },
  {
    id: "journal",
    time: "21:50–22:05",
    start: "21:50",
    end: "22:05",
    name: "Đóng ngày",
    tasks: [
      {
        id: "journal-10",
        title: "10 câu tiếng Anh + 1 việc mai",
        desc: "Today I did… Weak point… Tomorrow first block… Ngủ trước 23:00 để giữ 05:30.",
      },
    ],
  },
];

const FRIDAY_EXTRA = {
  id: "tracker",
  time: "Tối T6 · 15 phút",
  start: "22:05",
  end: "22:20",
  name: "Tracker tuần",
  tasks: [
    {
      id: "fri-track",
      title: "Cập nhật 4 dòng tracker",
      desc: "Mock L/R/W/S · % paper · số GS đã xem tuần này (mục tiêu ≥2) · 1 lỗ hổng kiến thức.",
    },
  ],
};

const MIN_DAY = [
  {
    id: "min",
    time: "2.5 giờ tối thiểu",
    start: "19:00",
    end: "21:30",
    name: "Ngày OT / mất sức (vẫn phải làm)",
    tasks: [
      {
        id: "min-write",
        title: "Writing 45 phút",
        desc: "Viết hoặc chữa — cửa IELTS không được bỏ dù ngày mệt.",
      },
      { id: "min-anki", title: "Anki 15 phút", desc: "Giữ streak từ vựng." },
      {
        id: "min-one",
        title: "Đúng một việc sâu 90 phút",
        desc: "Hoặc chữa Writing, hoặc 1 paper note, hoặc 1 experiment — không học 15 thứ.",
      },
    ],
  },
];

const SATURDAY = [
  {
    id: "sat-warm",
    time: "06:00–06:30",
    start: "06:00",
    end: "06:30",
    name: "Warm-up",
    tasks: [
      {
        id: "sat-anki",
        title: "Anki + ôn lỗi tuần trước",
        desc: "Ưu tiên thẻ đỏ / Writing mistakes list.",
      },
    ],
  },
  {
    id: "sat-mock",
    time: "06:30–08:45",
    start: "06:30",
    end: "08:45",
    name: "Mock timed (≈2h15)",
    tasks: [
      {
        id: "sat-test",
        title: "Làm đề đúng giờ",
        desc: "Tuần lẻ: Listening + Reading. Tuần chẵn: Writing Task 1 + 2 (đủ thời gian thi).",
      },
    ],
  },
  {
    id: "sat-fix",
    time: "09:00–10:30",
    start: "09:00",
    end: "10:30",
    name: "Chữa đề (90 phút)",
    tasks: [
      {
        id: "sat-review-w",
        title: "Chữa kỹ hơn làm đề",
        desc: "Writing: viết lại 1 đoạn ở band cao hơn. L/R: ghi mọi paraphrase sai.",
      },
    ],
  },
  {
    id: "sat-deep",
    time: "13:30–16:00",
    start: "13:30",
    end: "16:00",
    name: "Deep work 2.5 giờ",
    tasks: [
      {
        id: "sat-product",
        title: "Code thí nghiệm hoặc viết paper",
        desc: "Không xen IELTS trong khối này. Có 1 deliverable cụ thể trước 16:00.",
      },
    ],
  },
  {
    id: "sat-labs",
    time: "16:00–16:45",
    start: "16:00",
    end: "16:45",
    name: "Lab Úc / Nhật",
    tasks: [
      {
        id: "sat-abs",
        title: "2 abstract + conclusion của lab mục tiêu",
        desc: "Ghi fit với paper của bạn + 3 câu hỏi để hỏi GS sau này.",
      },
    ],
  },
];

const SUNDAY = [
  {
    id: "sun-speak",
    time: "05:45–07:00",
    start: "05:45",
    end: "07:00",
    name: "Speaking (75 phút)",
    tasks: [
      {
        id: "sun-cue",
        title: "3 cue card + phỏng vấn nghiên cứu 10 phút",
        desc: "Ghi âm. Thêm: What is your research question? Why this lab?",
      },
    ],
  },
  {
    id: "sun-lit",
    time: "07:00–09:15",
    start: "07:00",
    end: "09:15",
    name: "Literature (≈2h15)",
    tasks: [
      {
        id: "sun-paper",
        title: "1 paper đọc kỹ + 1–1.5 trang note tiếng Anh",
        desc: "Problem, method, data, gì mới, limitation, 8–10 cụm từ hay.",
      },
    ],
  },
  {
    id: "sun-grammar",
    time: "09:30–10:15",
    start: "09:30",
    end: "10:15",
    name: "Grammar (45 phút)",
    tasks: [
      {
        id: "sun-murphy",
        title: "1 unit English Grammar in Use + bài tập",
        desc: "Ưu tiên lỗi hay gặp trong Writing tuần này.",
      },
    ],
  },
  {
    id: "sun-geo",
    time: "15:00–16:45",
    start: "15:00",
    end: "16:45",
    name: "Úc hoặc Nhật xen tuần (≈1h45)",
    tasks: [
      {
        id: "sun-country",
        title: "Nghiên cứu 1 supervisor / 1 lab (sâu hơn)",
        desc: "Tuần lẻ: Úc RTP. Tuần chẵn: Nhật English-track. Ghi fit, funding, paper gần đây, lý do mail sau.",
      },
    ],
  },
  {
    id: "sun-plan",
    time: "16:45–17:15",
    start: "16:45",
    end: "17:15",
    name: "Kế hoạch tuần",
    tasks: [
      {
        id: "sun-goals",
        title: "3 mục tiêu tuần sau + giờ ngủ/dậy",
        desc: "Anh · code/paper · 1 deliverable. Khóa giờ ngủ để giữ 05:30.",
      },
    ],
  },
];

const WEEK_OVERVIEW = [
  {
    day: 1,
    name: "Thứ 2",
    lines: ["Writing Task 2 70′", "Toán / graph nền ≈1h50", "Related work Overleaf"],
  },
  {
    day: 2,
    name: "Thứ 3",
    lines: ["Paraphrase abstract", "Code PyG / thí nghiệm", "Debug repo"],
  },
  {
    day: 3,
    name: "Thứ 4",
    lines: ["Writing Task 2 70′", "Y sinh + leakage", "Method / caption"],
  },
  {
    day: 4,
    name: "Thứ 5",
    lines: ["Paraphrase abstract", "1 paper graph-biomed", "Paper lab mục tiêu"],
  },
  {
    day: 5,
    name: "Thứ 6",
    lines: ["Writing Task 2 70′", "README / figure", "Tracker tuần 15′"],
  },
  {
    day: 6,
    name: "Thứ 7",
    lines: ["Mock timed + chữa", "Deep work 2.5 giờ", "Lab abstracts"],
  },
  {
    day: 0,
    name: "Chủ nhật",
    lines: ["Speaking sớm + 1 paper kỹ", "Grammar", "Úc (lẻ) / Nhật (chẵn) + plan tuần"],
  },
];

const MILESTONES = [
  {
    id: "m1",
    title: "15/11/2026–2/2027 · Tăng tốc nền",
    body: "Giữ ≈6 giờ/ngày. IELTS đẩy về ~5.5. Chốt 1 hướng nối 2 paper sẵn có. Danh sách 15 GS Úc + 15 GS Nhật (đọc thật, không chỉ copy tên).",
  },
  {
    id: "m2",
    title: "3–6/2027 · Mock đều",
    body: "Mock mỗi tuần (T7). Draft paper 3 hoặc mở rộng paper cũ. Writing ổn định trước khi mail GS.",
  },
  {
    id: "m3",
    title: "7–9/2027 · Thi IELTS",
    body: "Thi khi mock ≥ 6.0 overall, Writing không dưới 6.0. Camera-ready / arXiv. Bắt đầu mail GS (Nhật trước).",
  },
  {
    id: "m4",
    title: "10/2027–1/2028 · Nộp",
    body: "Thi lại nếu Writing < 6.0. Proposal 2–3 trang. RTP Úc + MEXT theo GS.",
  },
  {
    id: "m5",
    title: "2–8/2028",
    body: "Phỏng vấn, SOP, hoàn tất vòng còn lại. Nhập học 2028.",
  },
];
