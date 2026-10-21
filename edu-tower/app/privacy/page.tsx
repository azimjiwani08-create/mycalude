import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy & data" };

export default function PrivacyPage() {
  return (
    <div className="container section" style={{ maxWidth: 760 }}>
      <h1 className="display" style={{ fontSize: 40 }}>Privacy &amp; your data</h1>
      <div className="stack" style={{ gap: 20 }}>
        <section><h2>What we collect</h2><p>Only what each feature needs: your name and WhatsApp number to hold a seat; your class attendance, homework and test answers to teach you. We never ask for passports, ID documents or bank papers anywhere on this site.</p></section>
        <section><h2>Who can see it</h2><p>You see your own record. Staff see records only for the office you study at (Mumbai or Vadodara). Parents see nothing unless you agree — and for students under 18, a parent must also sign a consent form with us first. You can withdraw parent access at any time from your portal.</p></section>
        <section><h2>Speaking recordings</h2><p>Your recording is stored privately, turned into text, scored, and then <strong>deleted</strong> — normally within minutes of marking. If you choose &ldquo;keep my recordings&rdquo; in your portal, we keep them until the end of your course plus 90 days, then delete them. The free diagnostic never uploads a recording.</p></section>
        <section><h2>AI help</h2><p>Scores and feedback from our AI are always labelled &ldquo;estimate&rdquo;. Your teacher can change any score, and both the AI estimate and the final score are kept. Questions to the Ask helper are stored without names or phone numbers so we can improve answers.</p></section>
        <section><h2>Retention</h2><p>Course records (attendance, scores, reports) are kept for 2 years after your course ends, then deleted. Diagnostic results not linked to a booking are deleted after 90 days. Ask a counsellor to delete your record sooner.</p></section>
      </div>
    </div>
  );
}
