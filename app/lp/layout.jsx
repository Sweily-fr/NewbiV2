// Layout des landing pages Google Ads : volontairement hors de (main) pour ne
// pas hériter de Footer7 (dizaines de liens sortants). Chaque LP embarque son
// propre LpShell (navbar réduite + CTA sticky mobile + mini-footer légal).
export default function LpLayout({ children }) {
  return (
    <div className="overflow-x-clip bg-[#FDFDFD] text-gray-950">
      <main>{children}</main>
    </div>
  );
}
