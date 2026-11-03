export default function MtgCardBack() {
  return (
    <div
      className="flex-1"
      data-mtg-card-back="true"
      aria-label="MAGIC: THE GATHERING card back"
    >
      <div className="overflow-hidden rounded-[9px] bg-gradient-to-b from-[#e9c86f] via-[#b9892f] to-[#72501f] p-[3px] shadow-[0_10px_24px_rgba(72,52,24,0.2)]">
        <div className="relative aspect-[5/7] overflow-hidden rounded-[6px] border border-[#583e16b8] bg-black">
          <img
            src="/mtg-card-back.png"
            alt="MAGIC: THE GATHERING card back"
            className="absolute inset-0 block h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
