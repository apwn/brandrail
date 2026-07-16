export function BrandWordmark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className={`font-display font-bold tracking-[-0.035em] text-bone ${size === "sm" ? "text-lg" : "text-xl"}`}>
      brand<span className="border-b-[3px] border-signal pb-px">rail</span>
    </span>
  );
}
