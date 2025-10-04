import { Subject, Difficulty, TestType, Grade } from './types';

export const TEST_TYPES = Object.values(TestType);
export const SUBJECTS = Object.values(Subject);
export const GRADES = Object.values(Grade);
export const DIFFICULTIES = Object.values(Difficulty);

export const UNITS: { [key in Subject]: { [key in Grade]: string[] } } = {
    [Subject.Mathematics]: {
        [Grade.JH1]: ["正の数・負の数", "文字式", "方程式", "比例・反比例", "平面図形", "空間図形"],
        [Grade.JH2]: ["連立方程式", "一次関数", "図形の性質", "確率", "図形の証明"],
        [Grade.JH3]: ["二次方程式", "二次関数", "相似", "円", "三平方の定理", "標本調査"],
        [Grade.SH1]: ["数と式", "集合と論理", "二次関数", "三角比", "データの分析"],
        [Grade.SH2]: ["指数関数・対数関数", "三角関数", "微分", "積分", "数列", "ベクトル"],
        [Grade.SH3]: ["複素数平面", "微分の応用", "確率分布", "統計的推測", "極限", "行列"],
    },
    [Subject.English]: {
        [Grade.JH1]: ["アルファベットと発音", "be動詞", "一般動詞", "名詞・代名詞・冠詞", "疑問詞", "命令文", "現在進行形"],
        [Grade.JH2]: ["過去形", "未来表現", "助動詞", "比較", "不定詞", "動名詞", "接続詞"],
        [Grade.JH3]: ["現在完了形", "受動態", "関係代名詞", "間接疑問文", "分詞", "間接話法", "原形不定詞"],
        [Grade.SH1]: ["時制の復習", "仮定法基礎", "不定詞・動名詞の応用", "分詞構文", "比較の応用", "関係詞の応用", "接続詞・前置詞"],
        [Grade.SH2]: ["仮定法の応用", "分詞構文の応用", "関係詞(制限・非制限)", "名詞節・同格節", "強調構文・倒置", "省略・挿入", "英作文"],
        [Grade.SH3]: ["精読演習", "英文和訳", "和文英訳", "パラグラフ読解", "論理展開", "英語要約", "自由英作文"],
    },
};


export const TIME_LIMITS: { [key: number]: string } = {
    15: "3〜5問",
    30: "6〜10問",
    60: "10〜15問",
};
