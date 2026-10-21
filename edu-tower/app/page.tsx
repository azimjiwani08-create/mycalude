import Link from "next/link";
import { ChartScene, ChatScene, HeroScene, MicScene } from "@/components/Illustrations";
import { withPageDb } from "@/lib/pipeline";
import { inr } from "@/components/ui";

export default async function Home() {
  const courses = await withPageDb((db) => db.select("courses", { active: true }));
  return (
    <>
      <section className="section">
        <div className="container split">
          <HeroScene />
          <div className="stack" style={{ alignItems: "center", textAlign: "center" }}>
            <h1 className="display" style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>Find your band. Then beat it.</h1>
            <p style={{ fontSize: 19, maxWidth: 460 }}>A free 15-minute English check, then small batches, full mock tests and a weekly report — in Mumbai and Vadodara.</p>
            <div className="stack" style={{ width: "100%", maxWidth: 340, gap: 16 }}>
              <Link href="/diagnostic" className="btn btn-primary btn-block">Start free diagnostic</Link>
              <Link href="/login" className="btn btn-ghost btn-block">I already have an account</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container" aria-label="Courses">
        <div className="pill-strip">
          {courses.map((c) => (
            <Link key={c.id} href={`/courses?course=${c.id}`} className="pill green">{c.name}</Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container split flip">
          <ChartScene />
          <div>
            <h2 className="display" style={{ fontSize: "clamp(30px, 4.5vw, 48px)" }}>See the gap close.</h2>
            <p>Your portal shows today&apos;s classes, homework, attendance and every mock score next to your target band. Each week you get one short report — and your parent does too, only if you say yes.</p>
            <Link href="/diagnostic" className="btn btn-lime">Get your starting band</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <MicScene />
          <div>
            <h2 className="display" style={{ fontSize: "clamp(30px, 4.5vw, 48px)" }}>Feedback the same day.</h2>
            <p>Write an essay or record a speaking answer and get rubric-based feedback with a corrected sample. Scores are marked as estimates until your teacher checks them.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split flip">
          <ChatScene />
          <div>
            <h2 className="display" style={{ fontSize: "clamp(30px, 4.5vw, 48px)" }}>Questions? Just ask.</h2>
            <p>Fees, timings, which IELTS to take — our helper answers from our own approved information, and hands you to a counsellor on WhatsApp when it can&apos;t.</p>
            <Link href="/ask" className="btn btn-ghost">Ask the helper</Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2>Courses</h2>
          <div className="grid">
            {courses.map((c) => (
              <div key={c.id} className="card">
                <h3>{c.name}</h3>
                <p className="muted">{c.description}</p>
                <div className="row between">
                  <span className="pill">{c.weeks} weeks</span>
                  <strong>{inr(c.fee_inr)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
