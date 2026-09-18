export default function Loading() {
  return (
    <main className="relative z-0 max-w-[54%] animate-pulse px-4 pb-28 pt-20 md:max-w-[58%] md:px-8 md:pt-28">
      <div className="flex flex-col gap-4">
        {[100, 85, 92, 78, 88].map((widthPercent, i) => (
          <div
            key={i}
            className="h-[9vw] rounded bg-[#111111]/10 md:h-[5vw]"
            style={{ width: `${widthPercent}%` }}
          />
        ))}
      </div>
    </main>
  );
}
