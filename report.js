// The report of a batch (step 5): one line in the foot of the panel
// (« Last: Make 38: 36 created, 2 rewritten ▸ »), and, unfolded, the glyphs
// themselves — created, rewritten, recomputed, left alone and why, impossible
// and why. Pure (tests/test_report.mjs); marks-panel.js draws it, and a
// double-click on a glyph opens it.

import { problemLines, withoutText } from "./target.js";

// in the order the details list them
const KINDS = [
  { kind: "created", title: "Created", says: "created" },
  { kind: "rewritten", title: "Rewritten", says: "rewritten" },
  { kind: "recomputed", title: "Recomputed", says: "recomputed" },
  { kind: "unchanged", title: "Already in place", says: "already in place" },
  { kind: "left", title: "Left alone", says: "left alone" },
  { kind: "impossible", title: "Impossible", says: "impossible" },
];

/**
 * What one glyph of a Make or a Recompute came to, from what make.js answered:
 * {glyph, kind, why}.
 */
export function outcomeOf(glyph, result) {
  if (!result) {
    return { glyph, kind: "impossible", why: "no rule" };
  }
  if (result.left) {
    return { glyph, kind: "left", why: result.left };
  }
  if (result.ok) {
    // the sources left out, named (5 bis § 5)
    const without = withoutText(
      (result.warnings || [])
        .filter((warning) => warning.code === "source-skipped")
        .map((warning) => ({ source: warning.source, glyphs: warning.glyphs }))
    );
    if (result.created) {
      return { glyph, kind: "created", why: without };
    }
    if ("moved" in result) {
      return result.moved
        ? { glyph, kind: "recomputed", why: "" }
        : { glyph, kind: "unchanged", why: "" };
    }
    return {
      glyph,
      kind: "rewritten",
      why: [result.overwritten ? "its drawing replaced" : "", without].filter((text) => text).join("; "),
    };
  }
  if (result.needsOverwrite) {
    return { glyph, kind: "left", why: "drawn by hand" };
  }
  if (result.mismatches?.length) {
    return { glyph, kind: "impossible", why: "its components are not the rule's: Make it" };
  }
  // condensed: one line per cause, its sources grouped (5 bis § 7)
  const why = problemLines(result.problems || [], result.sourceCount).join("; ");
  return { glyph, kind: "impossible", why: why || "no rule" };
}

/**
 * {summary, groups: [{title, rows: [{glyph, detail}]}]} of a batch labelled
 * `label` (« Make 38 », « Recompute 3 »).
 */
export function batchReport(label, outcomes) {
  const groups = [];
  const counts = [];
  for (const { kind, title, says } of KINDS) {
    const rows = outcomes
      .filter((outcome) => outcome.kind === kind)
      .map((outcome) => ({ glyph: outcome.glyph, detail: outcome.why || "" }));
    if (!rows.length) {
      continue;
    }
    groups.push({ title, kind, rows });
    counts.push(`${rows.length} ${says}`);
  }
  const written = outcomes.some((outcome) => ["created", "rewritten", "recomputed"].includes(outcome.kind));
  const summary = counts.length
    ? `${label}: ${counts.join(", ")}.${written ? " Undo last batch takes it back." : ""}`
    : `${label}: nothing to do.`;
  return { summary, groups };
}
