"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calculator,
  BookOpen,
  Brain,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

/**
 * Single-page “game” to learn Chapter 1 (Accounting in Business)
 * Focus: Analyze transactions using the accounting equation.
 *
 * How to use:
 * - Start at "Quest" and go step-by-step.
 * - Use "Equation Lab" for interactive transaction practice.
 * - Use "Quick Sheet" for 1-page revision.
 * - Use "Practice" for questions + answers.
 */

const fmt = (n) => {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return sign + "$" + abs.toLocaleString();
};

function clampMoney(n) {
  // keep tidy; allcow negative for learning but limit extremes
  if (n > 999999999) return 999999999;
  if (n < -999999999) return -999999999;
  return n;
}

const QUICK_SHEET = [
  {
    title: "Accounting: what & why",
    bullets: [
      "Accounting = system to identify, record, and communicate business activities.",
      "It’s the language of business: helps decisions.",
      "Bookkeeping = recording only (part of accounting).",
    ],
  },
  {
    title: "Users of accounting info",
    bullets: [
      "External users (financial accounting): investors, lenders, regulators, auditors, suppliers, etc.",
      "Internal users (managerial accounting): CEO + managers (HR, marketing, production, etc.) for better decisions.",
    ],
  },
  {
    title: "Ethics + fraud triangle",
    bullets: [
      "Useful info must be trusted → ethics matter.",
      "Fraud triangle: Opportunity + Pressure + Rationalization.",
    ],
  },
  {
    title: "GAAP / IFRS / EAS",
    bullets: [
      "GAAP aims for: Relevance + Faithful representation.",
      "FASB sets GAAP (US). IASB sets IFRS (international).",
      "Egypt: EAS largely based on IFRS with local adjustments.",
    ],
  },
  {
    title: "Core principles + constraints",
    bullets: [
      "Cost (measurement) principle: record at actual cost.",
      "Matching principle: expenses recorded to generate revenue.",
      "Full disclosure: important details in notes.",
      "Constraints: cost-benefit + materiality.",
    ],
  },
  {
    title: "The accounting equation",
    bullets: [
      "Assets = Liabilities + Equity",
      "Assets: what the company owns/controls (cash, supplies, equipment, A/R).",
      "Liabilities: what the company owes (A/P, notes payable, wages payable).",
      "Equity: owner’s claim. Increases with investments & revenues; decreases with expenses & withdrawals.",
      "Expanded: A = L + Capital + Revenues − Expenses − Withdrawals",
    ],
  },
  {
    title: "Financial statements (links)",
    bullets: [
      "Income Statement: revenues − expenses = net income.",
      "Statement of Owner’s Equity: begins with capital, adds net income, subtracts withdrawals.",
      "Balance Sheet: assets, liabilities, ending equity.",
      "Statement of Cash Flows: how cash changed.",
    ],
  },
];

const PRACTICE = [
  {
    q: "1) Which is MOST likely an external user?",
    options: ["Production manager", "Marketing manager", "Bank lender", "HR manager"],
    a: 2,
    explain:
      "Lenders are external users; they rely on financial accounting reports. Managers are internal users.",
    tag: "Users",
  },
  {
    q: "2) Fraud triangle includes:",
    options: ["Opportunity, Pressure, Rationalization", "Assets, Liabilities, Equity", "Cost, Matching, Disclosure", "Revenue, Expense, Cash"],
    a: 0,
    explain: "Fraud needs a chance (opportunity), a reason (pressure), and a justification (rationalization).",
    tag: "Ethics",
  },
  {
    q: "3) If a business buys supplies ON CREDIT, what happens?",
    options: [
      "Assets ↑, Liabilities ↑",
      "Assets ↓, Liabilities ↓",
      "Assets ↑, Equity ↑",
      "Assets ↓, Equity ↓",
    ],
    a: 0,
    explain:
      "Supplies is an asset that increases; Accounts Payable is a liability that increases. Equation stays balanced.",
    tag: "Equation",
  },
  {
    q: "4) Revenues do what to equity?",
    options: ["Decrease equity", "Increase equity", "Do not affect equity", "Increase liabilities"],
    a: 1,
    explain: "Revenue increases equity because it represents value earned by the business.",
    tag: "Equation",
  },
  {
    q: "5) Which statement shows assets, liabilities, and equity at a point in time?",
    options: ["Income statement", "Balance sheet", "Statement of cash flows", "Owner’s equity statement"],
    a: 1,
    explain: "Balance sheet is a snapshot at a specific date.",
    tag: "Statements",
  },
];

const TXN_BANK = [
  {
    id: "T1",
    title: "Owner invests cash",
    story: "Owner invests $30,000 cash to start the business.",
    amount: 30000,
    expected: { cash: 30000, supplies: 0, equipment: 0, ar: 0, ap: 0, notes: 0, capital: 30000, withdrawals: 0, revenue: 0, expense: 0 },
    hint:
      "Investment increases Cash (asset ↑) and Owner’s Capital (equity ↑).",
  },
  {
    id: "T2",
    title: "Buy supplies for cash",
    story: "The business buys $2,500 supplies and pays cash.",
    amount: 2500,
    expected: { cash: -2500, supplies: 2500, equipment: 0, ar: 0, ap: 0, notes: 0, capital: 0, withdrawals: 0, revenue: 0, expense: 0 },
    hint:
      "Swap one asset for another: Cash ↓, Supplies ↑. Equity doesn’t change.",
  },
  {
    id: "T3",
    title: "Buy equipment for cash",
    story: "The business buys $26,000 equipment and pays cash.",
    amount: 26000,
    expected: { cash: -26000, supplies: 0, equipment: 26000, ar: 0, ap: 0, notes: 0, capital: 0, withdrawals: 0, revenue: 0, expense: 0 },
    hint:
      "Another asset swap: Cash ↓, Equipment ↑.",
  },
  {
    id: "T4",
    title: "Buy supplies on credit",
    story: "The business buys $7,100 supplies on account (credit).",
    amount: 7100,
    expected: { cash: 0, supplies: 7100, equipment: 0, ar: 0, ap: 7100, notes: 0, capital: 0, withdrawals: 0, revenue: 0, expense: 0 },
    hint:
      "Supplies ↑ (asset) and Accounts Payable ↑ (liability).",
  },
  {
    id: "T5",
    title: "Provide services for cash",
    story: "The business earns $4,200 cash from services immediately.",
    amount: 4200,
    expected: { cash: 4200, supplies: 0, equipment: 0, ar: 0, ap: 0, notes: 0, capital: 0, withdrawals: 0, revenue: 4200, expense: 0 },
    hint:
      "Cash ↑ (asset) and Revenue ↑ (equity ↑).",
  },
  {
    id: "T6",
    title: "Pay rent expense",
    story: "The business pays rent of $1,000 in cash.",
    amount: 1000,
    expected: { cash: -1000, supplies: 0, equipment: 0, ar: 0, ap: 0, notes: 0, capital: 0, withdrawals: 0, revenue: 0, expense: 1000 },
    hint:
      "Cash ↓ (asset) and Expense ↑ (which decreases equity overall).",
  },
  {
    id: "T7",
    title: "Pay salaries expense",
    story: "The business pays salaries of $700 in cash.",
    amount: 700,
    expected: { cash: -700, supplies: 0, equipment: 0, ar: 0, ap: 0, notes: 0, capital: 0, withdrawals: 0, revenue: 0, expense: 700 },
    hint:
      "Same pattern as rent: Cash ↓ and Expenses ↑ (equity ↓).",
  },
  {
    id: "T8",
    title: "Provide services on credit",
    story: "The business provides $1,600 consulting + $300 rental on credit (total $1,900).",
    amount: 1900,
    expected: { cash: 0, supplies: 0, equipment: 0, ar: 1900, ap: 0, notes: 0, capital: 0, withdrawals: 0, revenue: 1900, expense: 0 },
    hint:
      "No cash yet. Accounts Receivable ↑ and Revenue ↑.",
  },
  {
    id: "T9",
    title: "Collect receivable",
    story: "Customer pays $1,900 owed from the previous credit sale.",
    amount: 1900,
    expected: { cash: 1900, supplies: 0, equipment: 0, ar: -1900, ap: 0, notes: 0, capital: 0, withdrawals: 0, revenue: 0, expense: 0 },
    hint:
      "Convert A/R to Cash: Cash ↑, Accounts Receivable ↓. No new revenue now.",
  },
  {
    id: "T10",
    title: "Pay accounts payable",
    story: "The business pays $900 of what it owes suppliers.",
    amount: 900,
    expected: { cash: -900, supplies: 0, equipment: 0, ar: 0, ap: -900, notes: 0, capital: 0, withdrawals: 0, revenue: 0, expense: 0 },
    hint:
      "Paying a liability: Cash ↓, Accounts Payable ↓.",
  },
  {
    id: "T11",
    title: "Owner withdraws cash",
    story: "Owner takes $200 cash for personal use.",
    amount: 200,
    expected: { cash: -200, supplies: 0, equipment: 0, ar: 0, ap: 0, notes: 0, capital: 0, withdrawals: 200, revenue: 0, expense: 0 },
    hint:
      "Withdrawals increase (equity decreases): Cash ↓ and Withdrawals ↑.",
  },
];

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
      {children}
    </span>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-semibold tabular-nums">{fmt(value)}</div>
    </div>
  );
}

function EquationPanel({ state }) {
  const assets = state.cash + state.supplies + state.equipment + state.ar;
  const liabilities = state.ap + state.notes;
  const equity = state.capital + state.revenue - state.expense - state.withdrawals;
  const balanced = assets === liabilities + equity;

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" /> Equation Scoreboard
          <Badge variant={balanced ? "default" : "destructive"} className="ml-auto">
            {balanced ? "Balanced" : "Not balanced"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border p-3">
            <div className="text-xs font-semibold text-muted-foreground">ASSETS</div>
            <div className="mt-1 text-xl font-bold tabular-nums">{fmt(assets)}</div>
            <div className="mt-2 space-y-1">
              <StatRow label="Cash" value={state.cash} />
              <StatRow label="Supplies" value={state.supplies} />
              <StatRow label="Equipment" value={state.equipment} />
              <StatRow label="Accounts Receivable" value={state.ar} />
            </div>
          </div>

          <div className="rounded-2xl border p-3">
            <div className="text-xs font-semibold text-muted-foreground">LIABILITIES</div>
            <div className="mt-1 text-xl font-bold tabular-nums">{fmt(liabilities)}</div>
            <div className="mt-2 space-y-1">
              <StatRow label="Accounts Payable" value={state.ap} />
              <StatRow label="Notes Payable" value={state.notes} />
            </div>
          </div>

          <div className="rounded-2xl border p-3">
            <div className="text-xs font-semibold text-muted-foreground">EQUITY</div>
            <div className="mt-1 text-xl font-bold tabular-nums">{fmt(equity)}</div>
            <div className="mt-2 space-y-1">
              <StatRow label="Owner Capital" value={state.capital} />
              <StatRow label="Revenues" value={state.revenue} />
              <StatRow label="Expenses" value={state.expense} />
              <StatRow label="Withdrawals" value={state.withdrawals} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Pill>
              Assets = Cash + Supplies + Equipment + A/R
            </Pill>
            <Pill>Liabilities = A/P + Notes</Pill>
            <Pill>
              Equity = Capital + Revenues − Expenses − Withdrawals
            </Pill>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="font-semibold">Check:</div>
            <div className="font-mono text-sm">
              {fmt(assets)} {"="} {fmt(liabilities)} {"+"} {fmt(equity)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StepCoach({ step, txn }) {
  const steps = [
    {
      title: "1) Read the story",
      body:
        "Who is involved? What happened? Is it cash, credit, expense, revenue, owner action, or liability?",
    },
    {
      title: "2) Pick the accounts",
      body:
        "Choose which accounts change (at least TWO). Example: Cash + Revenue, or Supplies + Accounts Payable.",
    },
    {
      title: "3) Decide direction",
      body:
        "For each chosen account, decide Increase (↑) or Decrease (↓).",
    },
    {
      title: "4) Enter amounts",
      body:
        "Same amount on both sides of the equation (but could be different accounts).",
    },
    {
      title: "5) Balance check",
      body:
        "Confirm Assets = Liabilities + Equity still holds. If not, re-check accounts/directions.",
    },
  ];

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5" /> Step-by-step Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border p-3">
          <div className="text-xs font-semibold text-muted-foreground">CURRENT TRANSACTION</div>
          <div className="mt-1 font-semibold">{txn.title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{txn.story}</div>
          <div className="mt-2">
            <Badge variant="secondary">Amount: {fmt(txn.amount)}</Badge>
          </div>
        </div>

        <div className="space-y-2">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className={`rounded-2xl border p-3 ${
                i === step ? "bg-muted" : "opacity-80"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{s.title}</div>
                {i < step ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : i === step ? (
                  <Badge>Now</Badge>
                ) : (
                  <Badge variant="outline">Next</Badge>
                )}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.body}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border p-3 text-sm">
          <div className="flex items-start gap-2">
            <HelpCircle className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-semibold">Hint</div>
              <div className="text-muted-foreground">{txn.hint}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaInput({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <Input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="rounded-xl"
      />
      <div className="text-[11px] text-muted-foreground">
        Use negative for decrease (e.g., -1000).
      </div>
    </div>
  );
}

function EquationLab() {
  const emptyState = {
    cash: 0,
    supplies: 0,
    equipment: 0,
    ar: 0,
    ap: 0,
    notes: 0,
    capital: 0,
    withdrawals: 0,
    revenue: 0,
    expense: 0,
  };

  const [running, setRunning] = useState({ ...emptyState });
  const [txnIndex, setTxnIndex] = useState(0);
  const [coachStep, setCoachStep] = useState(0);

  // player-entered deltas for the current transaction
  const [delta, setDelta] = useState({ ...emptyState });
  const [lastResult, setLastResult] = useState(null);
  const txn = TXN_BANK[txnIndex];

  const progress = Math.round(((txnIndex) / (TXN_BANK.length)) * 100);

  const expected = useMemo(() => txn.expected, [txnIndex]);

  const parseDelta = (obj) => {
    const out = {};
    for (const k of Object.keys(obj)) {
      const v = String(obj[k] ?? "").trim();
      const n = v === "" || v === "-" ? 0 : Number(v);
      out[k] = clampMoney(Number.isFinite(n) ? n : 0);
    }
    return out;
  };

  const applyDelta = (base, d) => {
    const next = { ...base };
    for (const k of Object.keys(d)) next[k] = clampMoney(next[k] + d[k]);
    return next;
  };

  const resetTxnInput = () => {
    setDelta({ ...emptyState });
    setCoachStep(0);
    setLastResult(null);
  };

  const check = () => {
    const d = parseDelta(delta);
    const keys = Object.keys(emptyState);
    const mismatches = [];
    for (const k of keys) {
      if (d[k] !== expected[k]) mismatches.push(k);
    }
    const ok = mismatches.length === 0;
    setLastResult({ ok, mismatches, entered: d, expected });
    return ok;
  };

  const submit = () => {
    const ok = check();
    if (!ok) return;
    const d = parseDelta(delta);
    setRunning((prev) => applyDelta(prev, d));
  };

  const nextTxn = () => {
    // if last was correct and submitted, move on
    setTxnIndex((i) => Math.min(TXN_BANK.length - 1, i + 1));
    resetTxnInput();
  };

  const prevTxn = () => {
    setTxnIndex((i) => Math.max(0, i - 1));
    resetTxnInput();
  };

  const jumpTo = (i) => {
    setTxnIndex(i);
    resetTxnInput();
  };

  const resetAll = () => {
    setRunning({ ...emptyState });
    setTxnIndex(0);
    resetTxnInput();
  };

  const assets = running.cash + running.supplies + running.equipment + running.ar;
  const liabilities = running.ap + running.notes;
  const equity = running.capital + running.revenue - running.expense - running.withdrawals;
  const balanced = assets === liabilities + equity;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <EquationPanel state={running} />

          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5" /> Transaction Challenge
                <Badge variant="secondary" className="ml-auto">
                  {txn.id} / {TXN_BANK.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Progress</div>
                  <div className="text-sm font-semibold">{progress}%</div>
                </div>
                <Progress value={progress} />
              </div>

              <div className="rounded-2xl border p-3">
                <div className="text-xs font-semibold text-muted-foreground">STORY</div>
                <div className="mt-1 font-semibold">{txn.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{txn.story}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">Amount: {fmt(txn.amount)}</Badge>
                  <Badge variant={balanced ? "default" : "destructive"}>
                    Scoreboard: {balanced ? "Balanced" : "Fix it"}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-semibold">Enter the changes for THIS transaction</div>
                  <Button variant="ghost" onClick={resetTxnInput} className="rounded-xl">
                    <RotateCcw className="mr-2 h-4 w-4" /> Clear
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border p-3 space-y-3">
                    <div className="text-xs font-semibold text-muted-foreground">ASSET Δ</div>
                    <DeltaInput
                      label="Cash"
                      value={delta.cash}
                      onChange={(v) => setDelta((d) => ({ ...d, cash: v }))}
                    />
                    <DeltaInput
                      label="Supplies"
                      value={delta.supplies}
                      onChange={(v) => setDelta((d) => ({ ...d, supplies: v }))}
                    />
                    <DeltaInput
                      label="Equipment"
                      value={delta.equipment}
                      onChange={(v) => setDelta((d) => ({ ...d, equipment: v }))}
                    />
                    <DeltaInput
                      label="Accounts Receivable"
                      value={delta.ar}
                      onChange={(v) => setDelta((d) => ({ ...d, ar: v }))}
                    />
                  </div>

                  <div className="rounded-2xl border p-3 space-y-3">
                    <div className="text-xs font-semibold text-muted-foreground">LIABILITY + EQUITY Δ</div>
                    <DeltaInput
                      label="Accounts Payable"
                      value={delta.ap}
                      onChange={(v) => setDelta((d) => ({ ...d, ap: v }))}
                    />
                    <DeltaInput
                      label="Notes Payable"
                      value={delta.notes}
                      onChange={(v) => setDelta((d) => ({ ...d, notes: v }))}
                    />
                    <DeltaInput
                      label="Owner Capital"
                      value={delta.capital}
                      onChange={(v) => setDelta((d) => ({ ...d, capital: v }))}
                    />
                    <DeltaInput
                      label="Withdrawals"
                      value={delta.withdrawals}
                      onChange={(v) => setDelta((d) => ({ ...d, withdrawals: v }))}
                    />
                    <DeltaInput
                      label="Revenues"
                      value={delta.revenue}
                      onChange={(v) => setDelta((d) => ({ ...d, revenue: v }))}
                    />
                    <DeltaInput
                      label="Expenses"
                      value={delta.expense}
                      onChange={(v) => setDelta((d) => ({ ...d, expense: v }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={submit} className="rounded-xl">
                  Check & Apply <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={check} className="rounded-xl">
                  Check Only
                </Button>
                <Button variant="outline" onClick={prevTxn} className="rounded-xl">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" onClick={nextTxn} className="rounded-xl">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="destructive" onClick={resetAll} className="rounded-xl ml-auto">
                  Reset Game
                </Button>
              </div>

              <AnimatePresence>
                {lastResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className={`rounded-2xl border p-3 ${
                      lastResult.ok ? "bg-muted" : "border-destructive/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {lastResult.ok ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5" />
                      ) : (
                        <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
                      )}
                      <div className="w-full">
                        <div className="font-semibold">
                          {lastResult.ok
                            ? "Correct! You can move to the next transaction."
                            : "Not quite. Fix these accounts:"}
                        </div>
                        {!lastResult.ok && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {lastResult.mismatches.map((k) => (
                              <Badge key={k} variant="destructive">
                                {k}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 text-sm text-muted-foreground">
                          Hint: {txn.hint}
                        </div>
                        <div className="mt-2 rounded-xl bg-background/50 p-2 text-xs">
                          <div className="font-semibold">If you’re stuck, here’s the pattern:</div>
                          <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                            <li>Cash sale: Cash ↑, Revenue ↑</li>
                            <li>Credit sale: A/R ↑, Revenue ↑</li>
                            <li>Pay expense: Cash ↓, Expense ↑</li>
                            <li>Buy on credit: Asset ↑, A/P ↑</li>
                            <li>Pay A/P: Cash ↓, A/P ↓</li>
                            <li>Owner invest: Cash ↑, Capital ↑</li>
                            <li>Owner withdraw: Cash ↓, Withdrawals ↑</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="rounded-2xl border p-3">
                <div className="text-xs font-semibold text-muted-foreground">TRANSACTION MAP</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TXN_BANK.map((t, i) => (
                    <Button
                      key={t.id}
                      variant={i === txnIndex ? "default" : "outline"}
                      onClick={() => jumpTo(i)}
                      className="rounded-xl"
                      size="sm"
                    >
                      {t.id}
                    </Button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Tip: You can replay transactions in any order.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <StepCoach step={coachStep} txn={txn} />
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Coach Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Move the coach one step at a time while you solve.
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl w-full"
                  onClick={() => setCoachStep((s) => Math.max(0, s - 1))}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  className="rounded-xl w-full"
                  onClick={() => setCoachStep((s) => Math.min(4, s + 1))}
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                className="rounded-xl w-full"
                onClick={() => setCoachStep(0)}
              >
                Restart Coach
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickSheet() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-2xl shadow-sm lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" /> 1-Page Quick Review
            <Badge variant="secondary" className="ml-auto">Chapter 1</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {QUICK_SHEET.map((s) => (
              <div key={s.title} className="rounded-2xl border p-4">
                <div className="font-semibold">{s.title}</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {s.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Super-simple memorization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl border p-3">
            <div className="font-semibold">The 5 magic words</div>
            <div className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold">I-R-C-E-S</span>:
              Identify, Record, Communicate, (Equation), Statements.
            </div>
          </div>
          <div className="rounded-2xl border p-3">
            <div className="font-semibold">Equation chant</div>
            <div className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold">A = L + E</span>
              <div>Equity = Capital + Revenues − Expenses − Withdrawals</div>
            </div>
          </div>
          <div className="rounded-2xl border p-3">
            <div className="font-semibold">Transaction patterns (memorize)</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Cash sale: Cash ↑, Revenue ↑</li>
              <li>Credit sale: A/R ↑, Revenue ↑</li>
              <li>Pay expense: Cash ↓, Expense ↑</li>
              <li>Buy on credit: Asset ↑, A/P ↑</li>
              <li>Pay A/P: Cash ↓, A/P ↓</li>
              <li>Owner invest: Cash ↑, Capital ↑</li>
              <li>Owner withdraw: Cash ↓, Withdrawals ↑</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Mini-checklist before exam</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="rounded-2xl border p-3">
            ✅ Know definitions: Assets, Liabilities, Equity.
          </div>
          <div className="rounded-2xl border p-3">
            ✅ Know who uses accounting: Internal vs External.
          </div>
          <div className="rounded-2xl border p-3">
            ✅ Know Ethics + Fraud triangle.
          </div>
          <div className="rounded-2xl border p-3">
            ✅ Practice: analyze transactions with A = L + E.
          </div>
          <div className="rounded-2xl border p-3">
            ✅ Understand statement links: Net income → Owner’s equity → Balance sheet.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PracticeQuiz() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [show, setShow] = useState(false);
  const [score, setScore] = useState(0);

  const item = PRACTICE[idx];

  const pick = (i) => {
    setSelected(i);
    setShow(true);
    if (i === item.a) setScore((s) => s + 1);
  };

  const next = () => {
    setIdx((i) => Math.min(PRACTICE.length - 1, i + 1));
    setSelected(null);
    setShow(false);
  };

  const reset = () => {
    setIdx(0);
    setSelected(null);
    setShow(false);
    setScore(0);
  };

  const progress = Math.round(((idx + 1) / PRACTICE.length) * 100);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="rounded-2xl shadow-sm lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5" /> Practice Questions
            <Badge variant="secondary" className="ml-auto">
              {idx + 1}/{PRACTICE.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Progress</div>
              <div className="text-sm font-semibold">{progress}%</div>
            </div>
            <Progress value={progress} />
          </div>

          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2">
              <div className="font-semibold">{item.q}</div>
              <Badge variant="outline" className="ml-auto">{item.tag}</Badge>
            </div>
            <div className="mt-3 grid gap-2">
              {item.options.map((opt, i) => {
                const isChosen = selected === i;
                const isCorrect = i === item.a;
                const showColor = show;
                return (
                  <Button
                    key={opt}
                    variant={
                      !showColor
                        ? "outline"
                        : isCorrect
                        ? "default"
                        : isChosen
                        ? "destructive"
                        : "outline"
                    }
                    className="justify-start rounded-xl"
                    onClick={() => (!show ? pick(i) : null)}
                  >
                    {opt}
                  </Button>
                );
              })}
            </div>

            <AnimatePresence>
              {show && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-3 rounded-2xl bg-muted p-3"
                >
                  <div className="flex items-start gap-2">
                    {selected === item.a ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <div className="font-semibold">
                        Answer: {item.options[item.a]}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {item.explain}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2">
            <Button onClick={next} className="rounded-xl" disabled={idx === PRACTICE.length - 1}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={reset} className="rounded-xl">
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl border p-3">
            <div className="text-sm text-muted-foreground">Correct answers</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">
              {score} / {PRACTICE.length}
            </div>
          </div>
          <div className="rounded-2xl border p-3 text-sm text-muted-foreground">
            Tip: After you finish, go to <span className="font-semibold">Equation Lab</span> and
            solve transactions again.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuestMode() {
  const [stage, setStage] = useState(0);

  const stages = [
    {
      title: "Level 1 — Learn the equation",
      body:
        "Memorize: Assets = Liabilities + Equity. Then memorize: Equity = Capital + Revenues − Expenses − Withdrawals.",
      cta: "I know the equation",
    },
    {
      title: "Level 2 — Learn the 7 transaction patterns",
      body:
        "Cash sale (Cash ↑, Rev ↑), Credit sale (A/R ↑, Rev ↑), Pay expense (Cash ↓, Exp ↑), Buy on credit (Asset ↑, A/P ↑), Pay A/P (Cash ↓, A/P ↓), Owner invest (Cash ↑, Capital ↑), Owner withdraw (Cash ↓, Withdrawals ↑).",
      cta: "I know the patterns",
    },
    {
      title: "Level 3 — Play Equation Lab step-by-step",
      body:
        "Go to Equation Lab and solve T1 → T11. Use the Coach controls to guide you through each transaction.",
      cta: "Take me to Equation Lab",
      jump: "lab",
    },
    {
      title: "Level 4 — Practice quiz",
      body:
        "Try the practice questions. If you miss any, return to Quick Sheet for review.",
      cta: "Take me to Practice",
      jump: "practice",
    },
  ];

  const current = stages[stage];

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5" /> Quest Mode (Step-by-step)
          <Badge variant="secondary" className="ml-auto">
            {stage + 1}/{stages.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border p-4">
          <div className="text-xl font-bold">{current.title}</div>
          <div className="mt-2 text-sm text-muted-foreground">{current.body}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setStage((s) => Math.max(0, s - 1))}
            disabled={stage === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            className="rounded-xl"
            onClick={() => setStage((s) => Math.min(stages.length - 1, s + 1))}
            disabled={stage === stages.length - 1}
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-2xl bg-muted p-3 text-sm">
          <div className="font-semibold">Your goal today</div>
          <div className="text-muted-foreground">
            Master transaction analysis. If you can solve T1–T11 correctly, you will do great in the exam.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountingChapter1Game() {
  const [tab, setTab] = useState("quest");

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
                <Sparkles className="h-4 w-4" />
                Accounting for Managers — Chapter 1 Game
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Learn it like a game (and master transaction analysis) created By Mahmoud Yehia Alabady -_- 
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                This page includes: a 1-page revision sheet, practice Q&A, and an interactive step-by-step
                “Equation Lab” focused on analyzing business transactions using the accounting equation.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Pill>Memorize</Pill>
              <Pill>Practice</Pill>
              <Pill>Apply (A = L + E)</Pill>
            </div>
          </div>
        </motion.div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="rounded-2xl">
            <TabsTrigger value="quest" className="rounded-xl">Quest</TabsTrigger>
            <TabsTrigger value="lab" className="rounded-xl">Equation Lab</TabsTrigger>
            <TabsTrigger value="quick" className="rounded-xl">Quick Sheet</TabsTrigger>
            <TabsTrigger value="practice" className="rounded-xl">Practice</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="quest" className="m-0">
              <QuestMode />
            </TabsContent>
            <TabsContent value="lab" className="m-0">
              <EquationLab />
            </TabsContent>
            <TabsContent value="quick" className="m-0">
              <QuickSheet />
            </TabsContent>
            <TabsContent value="practice" className="m-0">
              <PracticeQuiz />
            </TabsContent>
          </div>
        </Tabs>

        <div className="mt-8 rounded-2xl border p-4 text-sm text-muted-foreground">
          <div className="font-semibold text-foreground">How to study with this game (recommended)</div>
          <ol className="mt-2 list-decimal pl-5 space-y-1">
            <li>Open <span className="font-semibold">Quick Sheet</span> and read once.</li>
            <li>Go to <span className="font-semibold">Equation Lab</span> and solve T1 → T11 using the coach.</li>
            <li>Do <span className="font-semibold">Practice</span> questions.</li>
            <li>Repeat Equation Lab until you can solve all transactions without hints.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
