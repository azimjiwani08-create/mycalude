import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { IconButton } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/Frame";
import { ICON } from "@/lib/icons";

export default function LegalPage() {
  return (
    <main className="pb-16">
      <TopBar>
        <IconButton label="Back" href="/">
          <ArrowLeft size={ICON.md} />
        </IconButton>
      </TopBar>
      <div className="space-y-10 px-5 pt-6">
        <section id="terms" className="scroll-mt-6">
          <h1 className="font-serif text-headline text-ink">Terms of use</h1>
          <p className="mt-1 text-caption text-ink-2">Prototype placeholder. Not legal text.</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-body text-ink">
            <li>Beside offers paid, one-to-one conversation sessions in public venues.</li>
            <li>Sessions are never romantic or physical. Breaking this ends your account.</li>
            <li>All messages and payments stay inside Beside.</li>
            <li>Either person can end a session at any time.</li>
          </ul>
        </section>
        <section id="privacy" className="scroll-mt-6">
          <h2 className="text-section text-ink">Privacy</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-body text-ink">
            <li>Your phone number is never shown to companions.</li>
            <li>ID images are deleted once verification is complete.</li>
            <li>Companion photos are shown in full only to verified members.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
