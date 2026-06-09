import { MatchPrediction, LeaderboardUser, UserProfile } from './types';

export const INITIAL_USER: UserProfile = {
  username: "alex_rivera",
  fullName: "Alex Rivera",
  email: "alex.rivera@westfield.edu",
  studentId: "SU-2024-8902",
  points: 2850,
  rank: 42,
  accuracy: 84,
  predictionsCount: 128,
  winStreak: 5,
  classYear: "Class of 2024",
  department: "Business Admin",
  avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxoWhez9GdIaYqL6r9uhYLqLTY6zyMT48GPRS7jvnw18I6dH4jy2fevVCzwVDK_5fzOjU3DsV7KqtCf7iEE3KyxcropPfWBzDmtXNWea8gXRM5M3osQrIE9fs7BxSwroqCb66VsnCz_eUR44w7TOxrQFl9DoBit2dAXTHLn-nvU1tKWkNEyP7pHMjk4bMCz1KJtOAwT0kqs6Tq-o0AdNAZ6Z18CvNy_UF4lBKp3gPD3N-Uf7DGoL9UbX8akk9vUCkUNQwdJe_SdB9F"
};

export const INITIAL_PREDICTIONS: MatchPrediction[] = [
  {
    id: "groupA_1",
    group: "Group A",
    teamA: "France",
    teamB: "Brazil",
    teamAFlag: "FR",
    teamBFlag: "BR",
    scoreA: "",
    scoreB: "",
    kickoffTime: "Tomorrow, 20:00 PM",
    dateLabel: "Tomorrow, June 14th",
    isClosed: false
  },
  {
    id: "groupA_2",
    group: "Group A",
    teamA: "Argentina",
    teamB: "Spain",
    teamAFlag: "AR",
    teamBFlag: "ES",
    scoreA: "1",
    scoreB: "0",
    kickoffTime: "Closed",
    dateLabel: "June 12th, 2024",
    isClosed: true,
    actualScoreA: 1,
    actualScoreB: 0,
    userScoreA: 1,
    userScoreB: 0,
    status: 'CORRECT',
    pointsEarned: 150
  },
  {
    id: "groupB_1",
    group: "Group B",
    teamA: "Germany",
    teamB: "Japan",
    teamAFlag: "DE",
    teamBFlag: "JP",
    scoreA: "",
    scoreB: "",
    kickoffTime: "18:00 PM",
    dateLabel: "June 15th, 2024",
    isClosed: false
  }
];

export const TODAY_SCHEDULE: MatchPrediction[] = [
  {
    id: "today_1",
    group: "Group A",
    teamA: "Germany",
    teamB: "Spain",
    teamAFlag: "DE",
    teamBFlag: "ES",
    scoreA: "",
    scoreB: "",
    kickoffTime: "Today, 20:45",
    dateLabel: "Today, 20:45",
    isClosed: false
  },
  {
    id: "today_2",
    group: "Group B",
    teamA: "Argentina",
    teamB: "Italy",
    teamAFlag: "AR",
    teamBFlag: "IT",
    scoreA: "",
    scoreB: "",
    kickoffTime: "Today, 21:00",
    dateLabel: "Today, 21:00",
    isClosed: false
  }
];

export const LEADERBOARD_DATA: LeaderboardUser[] = [
  {
    id: "user_1",
    rank: 1,
    username: "Marcus_V",
    department: "Computer Science",
    correctPercentage: 94,
    points: 3120,
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvxtZKhN4z_GYH9j2sJJZVVHhXzzwDm7KefjyBLr2I6GogciYjimXlttaXPBOCsQS0avI3RFcJx4PdNABOirQI9tMhjU7fOlIJ1w6Ui-jY8gusbJh9m9mJ8QdwhUy69BYA2xilXh-4lUqZea-jiq1b1TPBjzaoYGCFxkZHxGF3geck4kkGTLMxoZ7535rcFoTVnebmJIiHWsmny56Chwv0D_U0lmtUokgQvhGpu9cAOEqi8qXmeVal3p-hoX9nWbJb4GTXm9qhXgUO"
  },
  {
    id: "user_2",
    rank: 2,
    username: "Jordan_K",
    department: "Economics",
    correctPercentage: 88,
    points: 2840,
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuEdYp2VcOPP8VCag9g-AK6veiyu8-8-hJJAJOw423BbL84m2fJVaUd1bkO9zANjIDvq548xFPpDuEf0p5helM_1KXDZEj9rc-Sfb5K8i13qL0sVtPRIL0Wq71ieQgxbW-cw0rsXiY5WgiYZhoQHggmOlI9WIJQBbZ5BhKeoDXdQIt2pr_Hu3OWABOwFan1FunfHdQ8VzB8HnMGDGxndWMpbqfkgO506WL95vuNSuK34gUkUNsvv6r4ajusG_AL2KhWmGzcgSuGgEC2"
  },
  {
    id: "user_3",
    rank: 3,
    username: "Sarah_Predictions",
    department: "Engineering",
    correctPercentage: 85,
    points: 2715,
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHcnnIlKvdtwWmawU0Yn8eQC3SopHr__DXlDkqrNhJ69tze-PPkeDhG3hfjZLFGxGskGgI409x8nxLbY84e1IRbNGa-xvyx9EfRnneoWSF6Mh5BO3HCCotU0R3dta1Mov4iP8NrLLlEW-_w26Em-mVtsc3yPwQ6xgRp3TTL-XJp9Z7Y8xwbGSkJVDrW5s94JGLLELQKKDOQuu-nXzXo30RCmiqMcnLGHP3eLazh2RfRuHoPxLMdq8C44wfQ2_EHMqsCwUF8WIUKRWE"
  },
  {
    id: "user_4",
    rank: 4,
    username: "Tyler_Hill",
    department: "Engineering",
    correctPercentage: 82,
    points: 2690
  },
  {
    id: "user_5",
    rank: 5,
    username: "Lauren_S",
    department: "Design",
    correctPercentage: 79,
    points: 2555
  },
  {
    id: "user_6",
    rank: 6,
    username: "CollegeFanatic",
    department: "Humanities",
    correctPercentage: 78,
    points: 2490
  },
  {
    id: "user_7",
    rank: 7,
    username: "PredictPro",
    department: "Computer Science",
    correctPercentage: 77,
    points: 2410
  },
  {
    id: "user_8",
    rank: 8,
    username: "Emily_V",
    department: "Business Admin",
    correctPercentage: 75,
    points: 2320
  },
  {
    id: "user_9",
    rank: 9,
    username: "Devin_Soccer",
    department: "Economics",
    correctPercentage: 72,
    points: 2210
  },
  {
    id: "user_10",
    rank: 10,
    username: "Sophia_M",
    department: "Engineering",
    correctPercentage: 70,
    points: 2050
  }
];

export const PAST_PREDICTIONS: MatchPrediction[] = [
  {
    id: "past_1",
    group: "Friendly",
    teamA: "England",
    teamB: "France",
    teamAFlag: "GB",
    teamBFlag: "FR",
    scoreA: "3",
    scoreB: "1",
    kickoffTime: "Closed",
    dateLabel: "Oct 28, 2024",
    isClosed: true,
    actualScoreA: 3,
    actualScoreB: 1,
    userScoreA: 3,
    userScoreB: 1,
    status: 'CORRECT',
    pointsEarned: 150
  },
  {
    id: "past_2",
    group: "World Cup",
    teamA: "Brazil",
    teamB: "Argentina",
    teamAFlag: "BR",
    teamBFlag: "AR",
    scoreA: "0",
    scoreB: "0",
    kickoffTime: "Closed",
    dateLabel: "Oct 20, 2024",
    isClosed: true,
    actualScoreA: 0,
    actualScoreB: 0,
    userScoreA: 2,
    userScoreB: 1,
    status: 'INCORRECT',
    pointsEarned: 0
  },
  {
    id: "past_3",
    group: "Friendly",
    teamA: "Spain",
    teamB: "Germany",
    teamAFlag: "ES",
    teamBFlag: "DE",
    scoreA: "1",
    scoreB: "1",
    kickoffTime: "Closed",
    dateLabel: "Oct 12, 2024",
    isClosed: true,
    actualScoreA: 1,
    actualScoreB: 1,
    userScoreA: 1,
    userScoreB: 1,
    status: 'CORRECT',
    pointsEarned: 320
  }
];

export const FLAG_MAP: Record<string, string> = {
  FR: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2Z6KPfGbpFWsD0-TAggdF6z6GEHRBnwxBzsOt_asZKzNbpP8GLvUx_D2Tb0oVoNQKCVtMsGiPq9D6zQ0g8hHphgkDkEeU27pgbeg2BYLLIB3Sotj3sSn82tExB1tPLFB_mHuk5TPfRttLnNzQNmzXDY2-GY-L9WEH4XzP9GdkKw0knmD8QrVBMmBXqpR3JdBcJL9E1dJkkh1l_Lenuo_AuQF9jFp41kMlkpZmB2omQRVXsZZB9P0w2p41PDZheRItWU-HArZDEmMX",
  BR: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2SxTVJCLR8Pnp7UtVtr4S_0YUjC0xlx3nrBJf8nSMu-vhnayfhNtfUsZ5puxAOqpjn3ZpipZyy4VlyDpdZuCT8gLOdt-UDSYJdNiMeh2bdLtTs-28RUHHBEyQgt353XyoUcVRkirRHPGmQrbrkb0mt7DLO6d4yXkjxrrVh6JN01GAlwRGUGkCUe7ugYCqOt011Ry6lc6biJlYaJumARvAvwtoAtREpfWzswWUF4OTKQJy3ea9v_PKBHZhEM_cHnrVmJeu6dgJojA3",
  AR: "https://lh3.googleusercontent.com/aida-public/AB6AXuDL9hwqQ653N6qPZHZ191-fVbNRdu6-G2SAxILsyy-h_qvQOjZOv2l3iaz6aoH4M-QspuLHRTkQMJ6K0h7VIF_o-YuV7n_rRhl73NR13Iyzx-yVISLruugMhKOEDs611odB0sIvsdlapDkA1cdjssJTOEN8GpNBcD6hcIWO1TfTdxcx7DMsId0M2XlL2r4_DFfNmXUKjXzet7tF2m_Hx-eP7XMXagD_fs-CWDGojs775-sYGkwA0LdIBpkiEglIlToTu6BU-SOfcs5Z",
  ES: "https://lh3.googleusercontent.com/aida-public/AB6AXuDw0R7pXDCWqlCU3YmftLzp1HmtsaX7MWpNn6OyXaLYHx1IDva0khsaXYrrEFKkfl5USLxOTqTCTVWG_sd3YmeqbZAczTaJ2K5HyzeUlHL31l-mkRIuX9etNUqQAk715OCP6p9kq3-2zNJqjGVo6USb3YUmKNVOSRf85r0OBh8qw7iP6hGOnXuK5mDruZJgpYgFDv1IX2beZHbWof6lWZw17zObjhnCTnwRszYpjxOZ3uJu9auLePVlrEhgCxRAqDY_iDyPjnE7J4sr",
  DE: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOELorMRz0tRXpMR75-0drpLTJkTrMOeC63WencuzJ81TnlBeGJTHihKPZdEMprQalQt_BlUIW2do2B-DM9QVZPsXVWW_z_5oa6QLECCgliy62bLi9fI7sFWjLdt1Ypd_PAqLo0g-c4eV8nQKiitsJ80xIiEOPYOZb8dmFduUuiPnMX-lH8V_97-LzLaD8Nxkyv9Wm9IqjwtTyz3e5FBcfQnwSJcSNXix73sEy75Bm-loRCbulzHm1QCAwjsDypAhZ6lQJRQ_rI446",
  JP: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-omgVo7ZXt47g3G9ffcVmeWdAY2yzmi4fb6n4pF-3O3xcRtjkHpvRD81LYG3lbLZAc1NIPx4UG4v4qVCmT0yacV_NUSvDhqVgJrs2xmKBX4dZ7YdBZn-PODs9E3OY2y_qbCaFD4k-3qb3NW4QWzU_7Pu0pRD-p2TzX-iqpXO2CKvvABR8aPf7S4Yg24PJmxMbCS49Gk3C17tlN0L99nvEJ63G0T9t2bMcayu_ECS9qS6MrMiam9XBKBjUI5ZB9RfvyxZblhdeJmyJ",
  GB: "https://lh3.googleusercontent.com/aida-public/AB6AXuBNijrMp7nHNlU2GgN_L3L3JGqY8m1cdczxh1HiyXCCoZwzx_T4AD1CYznGVnMaq-R2hKzYtZH_y8-5W82r6_AFDkIl5fce5Xf_Rukmy89r7pBU5aN8aryBubtfnGckyqRc1dtnxuczrh2JULGHg0_9vTROkDchLgaLlcOk6vn2obyf8-NzfcElAxmmlQOc3sdzPy0xWqhHGJgZiodiHeueNLi9Cd9Wi9hUPfkrwkWyqp9niXFUQCTtw36tGbO3YiYgo4TjGx-og2jF",
  IT: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6yP6j31P4jpfL6iahDbRhOzy5vZxOaANAqZkxOqDs7s3GdxmQF70va5zhBJzQ7jBH0rsLv1OExEJMGQElmI-UXcyDNyWIo3x12DYQfAVhYK-hBecio4iaiYRDh1bwW8jjsiYfq1n2t7V-iRLZJQcRBVP9cyt42wB0EwC4yKtCRgTRqnN0bcml5m_rUHMFZJ7YRj8SfByqgFoSNqaVaO2oS4kE7r3IE2pARw-VbFDpgBiHFMnyTyfB6CMrNpC4ln3a9ulwU0gilZ36",
  DK: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-omgVo7ZXt47g3G9ffcVmeWdAY2yzmi4fb6n4pF-3O3xcRtjkHpvRD81LYG3lbLZAc1NIPx4UG4v4qVCmT0yacV_NUSvDhqVgJrs2xmKBX4dZ7YdBZn-PODs9E3OY2y_qbCaFD4k-3qb3NW4QWzU_7Pu0pRD-p2TzX-iqpXO2CKvvABR8aPf7S4Yg24PJmxMbCS49Gk3C17tlN0L99nvEJ63G0T9t2bMcayu_ECS9qS6MrMiam9XBKBjUI5ZB9RfvyxZblhdeJmyJ",
  GE: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2Z6KPfGbpFWsD0-TAggdF6z6GEHRBnwxBzsOt_asZKzNbpP8GLvUx_D2Tb0oVoNQKCVtMsGiPq9D6zQ0g8hHphgkDkEeU27pgbeg2BYLLIB3Sotj3sSn82tExB1tPLFB_mHuk5TPfRttLnNzQNmzXDY2-GY-L9WEH4XzP9GdkKw0knmD8QrVBMmBXqpR3JdBcJL9E1dJkkh1l_Lenuo_AuQF9jFp41kMlkpZmB2omQRVXsZZB9P0w2p41PDZheRItWU-HArZDEmMX",
  PT: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2SxTVJCLR8Pnp7UtVtr4S_0YUjC0xlx3nrBJf8nSMu-vhnayfhNtfUsZ5puxAOqpjn3ZpipZyy4VlyDpdZuCT8gLOdt-UDSYJdNiMeh2bdLtTs-28RUHHBEyQgt353XyoUcVRkirRHPGmQrbrkb0mt7DLO6d4yXkjxrrVh6JN01GAlwRGUGkCUe7ugYCqOt011Ry6lc6biJlYaJumARvAvwtoAtREpfWzswWUF4OTKQJy3ea9v_PKBHZhEM_cHnrVmJeu6dgJojA3",
  SI: "https://lh3.googleusercontent.com/aida-public/AB6AXuDL9hwqQ653N6qPZHZ191-fVbNRdu6-G2SAxILsyy-h_qvQOjZOv2l3iaz6aoH4M-QspuLHRTkQMJ6K0h7VIF_o-YuV7n_rRhl73NR13Iyzx-yVISLruugMhKOEDs611odB0sIvsdlapDkA1cdjssJTOEN8GpNBcD6hcIWO1TfTdxcx7DMsId0M2XlL2r4_DFfNmXUKjXzet7tF2m_Hx-eP7XMXagD_fs-CWDGojs775-sYGkwA0LdIBpkiEglIlToTu6BU-SOfcs5Z",
  BE: "https://lh3.googleusercontent.com/aida-public/AB6AXuDw0R7pXDCWqlCU3YmftLzp1HmtsaX7MWpNn6OyXaLYHx1IDva0khsaXYrrEFKkfl5USLxOTqTCTVWG_sd3YmeqbZAczTaJ2K5HyzeUlHL31l-mkRIuX9etNUqQAk715OCP6p9kq3-2zNJqjGVo6USb3YUmKNVOSRf85r0OBh8qw7iP6hGOnXuK5mDruZJgpYgFDv1IX2beZHbWof6lWZw17zObjhnCTnwRszYpjxOZ3uJu9auLePVlrEhgCxRAqDY_iDyPjnE7J4sr"
};
