const TZ = "Asia/Ho_Chi_Minh";

const WEEKDAY_BLOCKS = [
  {
    id: "morning",
    time: "06:20–07:20",
    start: "06:20",
    end: "07:20",
    name: "Sáng · tiếng Anh sản xuất",
    tasks: [
      {
        id: "shadow",
        title: "Shadowing 15 phút",
        desc: "1 đoạn, lặp 3 lần. BBC 6 Minute English; sau tháng 4 đổi talk khoa học.",
      },
      {
        id: "writing",
        title: "Writing 45 phút (không skip)",
        desc: "T2/T4/T6: IELTS Task 2. T3/T5: paraphrase abstract paper (của bạn hoặc người khác), rồi chữa.",
      },
    ],
  },
  {
    id: "lunch",
    time: "12:20–12:50",
    start: "12:20",
    end: "12:50",
    name: "Trưa · input ngắn",
    tasks: [
      {
        id: "anki",
        title: "Anki 15 phút",
        desc: "Academic Word List + cụm graph/y sinh. Học cụm, không học từ rời.",
      },
      {
        id: "reading-snack",
        title: "IELTS Reading 15 phút",
        desc: "Một đoạn Cambridge, tập paraphrase câu hỏi — không làm full test buổi trưa.",
      },
    ],
  },
  {
    id: "listen",
    time: "18:35–19:05",
    start: "18:35",
    end: "19:05",
    name: "Tối · nghe / nói",
    tasks: [
      {
        id: "listen-speak",
        title: "Listening hoặc Speaking 30 phút",
        desc: "T2/T4: dictation + chữa. T3/T5: ghi âm Speaking 2 phút × 2. T6: Listening Section 1–2.",
      },
    ],
  },
  {
    id: "major",
    time: "19:05–20:35",
    start: "19:05",
    end: "20:35",
    name: "Chuyên môn 90 phút",
    tasks: [
      {
        id: "major-90",
        title: "Khối Graph / y sinh theo thứ",
        desc: "T2 toán-graph. T3 code PyG. T4 y sinh + ethics/leakage. T5 1 paper graph-biomed. T6 README tiếng Anh hoặc figure paper.",
      },
    ],
  },
  {
    id: "research",
    time: "20:45–21:30",
    start: "20:45",
    end: "21:30",
    name: "Nghiên cứu 45 phút",
    tasks: [
      {
        id: "research-45",
        title: "Paper / Overleaf / thí nghiệm",
        desc: "T2 related work. T3 debug repo. T4 Method hoặc caption. T5 paper của lab Úc hoặc Nhật. T6 CV / bảng GS / nháp email (từ tháng 6/2027 làm thật).",
      },
    ],
  },
  {
    id: "journal",
    time: "21:30–21:45",
    start: "21:30",
    end: "21:45",
    name: "Đóng ngày",
    tasks: [
      {
        id: "journal-10",
        title: "10 câu tiếng Anh",
        desc: "Today I learned… Next I will… Ngủ trước 23:00.",
      },
    ],
  },
];

const FRIDAY_EXTRA = {
  id: "tracker",
  time: "Tối T6 · 15 phút",
  start: "21:45",
  end: "22:00",
  name: "Tracker tuần",
  tasks: [
    {
      id: "fri-track",
      title: "Cập nhật 4 dòng tracker",
      desc: "Mock L/R/W/S · % paper · số GS đã xem tuần này (mục tiêu 2) · 1 lỗ hổng kiến thức.",
    },
  ],
};

const MIN_DAY = [
  {
    id: "min",
    time: "90 phút tối thiểu",
    start: "19:00",
    end: "20:30",
    name: "Ngày OT / mất sức",
    tasks: [
      { id: "min-write", title: "Writing 30 phút", desc: "Vẫn phải viết hoặc chữa — đây là cửa IELTS." },
      { id: "min-anki", title: "Anki 10 phút", desc: "" },
      {
        id: "min-one",
        title: "Đúng một việc 50 phút",
        desc: "Hoặc chữa Writing, hoặc 1 paper note, hoặc 1 experiment — không học 15 thứ.",
      },
    ],
  },
];

const SATURDAY = [
  {
    id: "sat-review",
    time: "08:00–08:20",
    start: "08:00",
    end: "08:20",
    name: "Review",
    tasks: [{ id: "sat-anki", title: "Anki + từ tuần trước", desc: "" }],
  },
  {
    id: "sat-mock",
    time: "08:20–10:20",
    start: "08:20",
    end: "10:20",
    name: "Mini mock",
    tasks: [
      {
        id: "sat-test",
        title: "Làm đề timed",
        desc: "Tuần lẻ: Listening + Reading. Tuần chẵn: Writing Task 1 + 2.",
      },
    ],
  },
  {
    id: "sat-fix",
    time: "10:40–12:00",
    start: "10:40",
    end: "12:00",
    name: "Chữa đề",
    tasks: [
      {
        id: "sat-review-w",
        title: "Chữa kỹ hơn làm đề",
        desc: "Writing: viết lại 1 đoạn ở band cao hơn.",
      },
    ],
  },
  {
    id: "sat-deep",
    time: "13:30–16:30",
    start: "13:30",
    end: "16:30",
    name: "Deep work 3 giờ",
    tasks: [
      {
        id: "sat-product",
        title: "Code thí nghiệm hoặc viết paper",
        desc: "Không xen IELTS trong 3 giờ này.",
      },
    ],
  },
  {
    id: "sat-labs",
    time: "16:30–17:00",
    start: "16:30",
    end: "17:00",
    name: "Lab Úc / Nhật",
    tasks: [
      {
        id: "sat-abs",
        title: "2 abstract + conclusion của lab mục tiêu",
        desc: "",
      },
    ],
  },
];

const SUNDAY = [
  {
    id: "sun-speak",
    time: "08:30–09:15",
    start: "08:30",
    end: "09:15",
    name: "Speaking",
    tasks: [
      {
        id: "sun-cue",
        title: "3 cue card + phỏng vấn 5 phút",
        desc: "Mô phỏng: What is your research question?",
      },
    ],
  },
  {
    id: "sun-lit",
    time: "09:15–11:15",
    start: "09:15",
    end: "11:15",
    name: "Literature",
    tasks: [
      {
        id: "sun-paper",
        title: "1 paper đọc kỹ + 1 trang note tiếng Anh",
        desc: "Problem, method, data, gì mới, limitation, 8–10 cụm từ hay.",
      },
    ],
  },
  {
    id: "sun-grammar",
    time: "11:15–12:00",
    start: "11:15",
    end: "12:00",
    name: "Grammar",
    tasks: [{ id: "sun-murphy", title: "1 unit English Grammar in Use + bài tập", desc: "" }],
  },
  {
    id: "sun-geo",
    time: "15:00–16:30",
    start: "15:00",
    end: "16:30",
    name: "Úc hoặc Nhật xen tuần",
    tasks: [
      {
        id: "sun-country",
        title: "Nghiên cứu 1 supervisor / 1 lab",
        desc: "Tuần lẻ: Úc RTP. Tuần chẵn: Nhật English-track. Ghi fit với paper của bạn.",
      },
    ],
  },
  {
    id: "sun-plan",
    time: "16:30–17:00",
    start: "16:30",
    end: "17:00",
    name: "Kế hoạch tuần",
    tasks: [
      {
        id: "sun-goals",
        title: "3 mục tiêu tuần sau",
        desc: "Anh · code · 1 deliverable (đoạn paper, figure, hoặc mock).",
      },
    ],
  },
];

const WEEK_OVERVIEW = [
  {
    day: 1,
    name: "Thứ 2",
    lines: ["Writing Task 2", "Toán / graph nền", "Related work Overleaf"],
  },
  {
    day: 2,
    name: "Thứ 3",
    lines: ["Paraphrase abstract", "Code PyG", "Thí nghiệm / debug"],
  },
  {
    day: 3,
    name: "Thứ 4",
    lines: ["Writing Task 2", "Y sinh + leakage", "Method / caption"],
  },
  {
    day: 4,
    name: "Thứ 5",
    lines: ["Paraphrase abstract", "1 paper graph-biomed", "Paper của lab mục tiêu"],
  },
  {
    day: 5,
    name: "Thứ 6",
    lines: ["Writing Task 2", "README / figure", "Tracker 15 phút"],
  },
  {
    day: 6,
    name: "Thứ 7",
    lines: ["Mini mock + chữa", "Deep work 3 giờ", "Tối: nghỉ"],
  },
  {
    day: 0,
    name: "Chủ nhật",
    lines: ["Speaking + 1 paper kỹ", "Grammar", "Úc (lẻ) / Nhật (chẵn) + plan tuần"],
  },
];

const MILESTONES = [
  {
    id: "m1",
    title: "8–11/2026 · Nền",
    body: "IELTS ~5.0. Chọn 1 hướng nối 2 paper sẵn có. Danh sách 15 GS Úc + 15 GS Nhật.",
  },
  {
    id: "m2",
    title: "12/2026–3/2027 · 5.5",
    body: "Mock mỗi 2 tuần. Draft paper 3 hoặc mở rộng paper cũ. Chưa spam email GS.",
  },
  {
    id: "m3",
    title: "4–7/2027 · Thi IELTS",
    body: "Thi khi mock ≥ 6.0. Camera-ready / arXiv. Bắt đầu mail GS (Nhật trước).",
  },
  {
    id: "m4",
    title: "8–11/2027 · Nộp",
    body: "Thi lại nếu Writing < 6.0. Proposal 2–3 trang. RTP Úc + MEXT theo GS.",
  },
  {
    id: "m5",
    title: "12/2027–5/2028",
    body: "Phỏng vấn, SOP, hoàn tất vòng còn lại. Nhập học 2028.",
  },
];
