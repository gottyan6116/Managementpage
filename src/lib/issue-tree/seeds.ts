/**
 * 初期シード。ストレージが空 / 破損 / 利用不可のときの初期状態。
 * 既存デモ (補助金LP CVR改善 / 営業プロセス業務改善) を新スキーマで再構成。
 */
import type {
  IssueTreeEdge,
  IssueTreeNode,
  IssueTreeProject,
} from "./domain.ts";

const T = "2026-07-10";

function node(
  partial: Pick<IssueTreeNode, "id" | "projectId" | "treeType" | "parentId" | "order" | "title"> &
    Partial<IssueTreeNode>,
): IssueTreeNode {
  return {
    description: "",
    nodeType: "question",
    status: "unverified",
    priority: "medium",
    hypothesis: "",
    evidenceItems: [],
    validationData: { dataNeeded: "", method: "" },
    conclusion: "",
    ownerId: null,
    deadline: null,
    linkedTaskIds: [],
    collapsed: false,
    position: null,
    createdAt: T,
    updatedAt: T,
    ...partial,
  };
}

export function seedProjects(): IssueTreeProject[] {
  return [
    {
      id: "itp-1",
      clientName: "クリエイトデザイン合同会社",
      name: "補助金LP CVR改善",
      category: "Webマーケ",
      objective: "補助金申請LPのCVRを2.1%→4.0%へ引き上げる",
      kpis: [
        { id: "kpi-1", label: "CVR", target: "4.0%", current: "2.1%" },
        { id: "kpi-2", label: "フォーム完了率", target: "60%", current: "31%" },
        { id: "kpi-3", label: "CPA", target: "8,000円", current: "12,400円" },
      ],
      nextAction: "FVコピーABテストの結果レビュー (7/15)",
      status: "active",
      linkedProjectId: "p4",
      ownerId: "m-yamada",
      deadline: "2026-07-28",
      createdAt: "2026-07-01",
      updatedAt: T,
    },
    {
      id: "itp-2",
      clientName: "フューチャーリンク株式会社",
      name: "営業プロセス業務改善",
      category: "業務改善",
      objective: "CRM導入に合わせて営業リードタイムを30%短縮する",
      kpis: [
        { id: "kpi-4", label: "リードタイム", target: "-30%", current: "±0%" },
        { id: "kpi-5", label: "商談化率", target: "25%", current: "18%" },
      ],
      nextAction: "業務フロー可視化ワークショップの実施",
      status: "active",
      linkedProjectId: "p2",
      ownerId: "m-yamada",
      deadline: "2026-08-02",
      createdAt: "2026-07-01",
      updatedAt: "2026-07-09",
    },
  ];
}

export function seedNodes(): IssueTreeNode[] {
  return [
    node({
      id: "itn-1",
      projectId: "itp-1",
      treeType: "issue",
      parentId: null,
      order: 1,
      title: "なぜCVRが2.1%に留まっているのか",
      status: "testing",
      priority: "high",
      hypothesis: "流入の質ではなくLP内の離脱が主因",
      evidenceItems: [
        { id: "ev-1", text: "広告CTRは業界平均以上", source: "広告管理画面", createdAt: T },
        { id: "ev-2", text: "LP直帰率68%", source: "GA4", createdAt: T },
      ],
      validationData: {
        dataNeeded: "GA4ファネル / Clarityヒートマップ",
        method: "ファネル分析で離脱ポイントを特定",
      },
    }),
    node({
      id: "itn-2",
      projectId: "itp-1",
      treeType: "issue",
      parentId: "itn-1",
      order: 1,
      title: "FVで価値が伝わっていないのでは",
      nodeType: "hypothesis",
      status: "supported",
      priority: "high",
      hypothesis: "FV離脱率が高く、補助金額の訴求が弱い",
      evidenceItems: [
        { id: "ev-3", text: "スクロール到達率40%", source: "Clarity", createdAt: T },
      ],
      validationData: { dataNeeded: "Clarityスクロールマップ", method: "FVコピーABテスト" },
      conclusion: "FV改善で突破率が上がる見込み。金額訴求の具体化へ",
    }),
    node({
      id: "itn-3",
      projectId: "itp-1",
      treeType: "issue",
      parentId: "itn-1",
      order: 2,
      title: "フォームが長すぎるのでは",
      nodeType: "hypothesis",
      status: "testing",
      priority: "medium",
      hypothesis: "項目12個が完了率を下げている",
      evidenceItems: [
        { id: "ev-4", text: "フォーム開始→完了 31%", source: "GA4", createdAt: T },
      ],
      validationData: { dataNeeded: "項目別離脱データ", method: "項目5個への削減テスト" },
    }),
    node({
      id: "itn-4",
      projectId: "itp-1",
      treeType: "issue",
      parentId: "itn-1",
      order: 3,
      title: "信頼要素が不足しているのでは",
      nodeType: "hypothesis",
      status: "unverified",
      priority: "medium",
      validationData: {
        dataNeeded: "競合LPの信頼要素比較",
        method: "採択実績セクション追加の前後比較",
      },
    }),
    node({
      id: "itn-5",
      projectId: "itp-1",
      treeType: "issue",
      parentId: "itn-2",
      order: 1,
      title: "補助金額を数字で見せるべきか",
      nodeType: "action",
      status: "actionized",
      priority: "high",
      hypothesis: "「最大250万円」の明示でFV突破率が上がる",
      evidenceItems: [
        { id: "ev-5", text: "金額表記への注視を確認", source: "ヒートマップ", createdAt: T },
      ],
      validationData: { dataNeeded: "ABテスト結果", method: "コピー2案のABテスト" },
      conclusion: "実装タスク化済み。7/15にテスト結果レビュー",
    }),
    node({
      id: "itn-6",
      projectId: "itp-1",
      treeType: "kpi",
      parentId: null,
      order: 1,
      title: "CVR 4.0%",
      nodeType: "metric",
      status: "testing",
      priority: "high",
      validationData: { dataNeeded: "GA4", method: "" },
    }),
    node({
      id: "itn-7",
      projectId: "itp-1",
      treeType: "kpi",
      parentId: "itn-6",
      order: 1,
      title: "フォーム到達率 55%",
      nodeType: "metric",
      validationData: { dataNeeded: "GA4イベント", method: "" },
    }),
    node({
      id: "itn-8",
      projectId: "itp-1",
      treeType: "kpi",
      parentId: "itn-6",
      order: 2,
      title: "フォーム完了率 60%",
      nodeType: "metric",
      validationData: { dataNeeded: "GA4イベント", method: "" },
    }),
    node({
      id: "itn-9",
      projectId: "itp-2",
      treeType: "issue",
      parentId: null,
      order: 1,
      title: "なぜ商談化までのリードタイムが長いのか",
      status: "testing",
      priority: "high",
      hypothesis: "情報の分散と手入力の多さがボトルネック",
      evidenceItems: [
        { id: "ev-6", text: "リード対応まで平均2.5営業日", source: "ヒアリング", createdAt: T },
      ],
      validationData: {
        dataNeeded: "現行フローの工数実測",
        method: "業務フロー可視化ワークショップ",
      },
    }),
    node({
      id: "itn-10",
      projectId: "itp-2",
      treeType: "issue",
      parentId: "itn-9",
      order: 1,
      title: "リード情報の転記作業が多いのでは",
      nodeType: "hypothesis",
      status: "supported",
      priority: "high",
      hypothesis: "フォーム→Excel→CRMの三重入力が発生",
      evidenceItems: [
        { id: "ev-7", text: "週5時間の転記を確認", source: "ヒアリング", createdAt: T },
      ],
      validationData: { dataNeeded: "作業ログ", method: "CRM自動連携の効果試算" },
      conclusion: "自動連携で週5h削減見込み",
    }),
    node({
      id: "itn-11",
      projectId: "itp-2",
      treeType: "issue",
      parentId: "itn-9",
      order: 2,
      title: "担当割り当てルールが曖昧なのでは",
      nodeType: "hypothesis",
      status: "unverified",
      priority: "medium",
      hypothesis: "割り当て待ちで平均1営業日滞留",
      validationData: {
        dataNeeded: "対応開始までの時間分布",
        method: "自動割り当てルールの設計・検証",
      },
    }),
    node({
      id: "itn-12",
      projectId: "itp-2",
      treeType: "process",
      parentId: null,
      order: 1,
      title: "リード獲得〜商談化プロセス",
      nodeType: "process",
      status: "testing",
    }),
    node({
      id: "itn-13",
      projectId: "itp-2",
      treeType: "process",
      parentId: "itn-12",
      order: 1,
      title: "問い合わせ受付 (フォーム/電話)",
      nodeType: "process",
      priority: "low",
    }),
    node({
      id: "itn-14",
      projectId: "itp-2",
      treeType: "process",
      parentId: "itn-12",
      order: 2,
      title: "CRM登録・担当割り当て",
      nodeType: "process",
      status: "testing",
    }),
  ];
}

export function seedEdges(): IssueTreeEdge[] {
  return [
    {
      id: "ite-1",
      projectId: "itp-1",
      treeType: "issue",
      sourceNodeId: "itn-3",
      targetNodeId: "itn-5",
      relationType: "relates",
      label: "フォーム改善と併走",
      createdAt: T,
      updatedAt: T,
    },
  ];
}
