export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-[#FAFAF8] text-[#111111]">
      <main className="animate-pulse px-4 pb-32 pt-28 md:px-8 md:pt-32">
        <div className="mx-auto max-w-[1680px]">
          <div className="mt-[8vh] flex flex-col items-start gap-[8vw] lg:mt-[16vh] lg:flex-row">
            <div className="w-full lg:flex-[1.3]">
              <div className="mb-[6vh] h-[4.2vw] w-2/3 rounded bg-[#111111]/10 md:h-[1.9vw] lg:mb-[13vh]" />
              <div className="aspect-[4/5] w-full rounded bg-[#111111]/10" />
            </div>
            <div className="w-full lg:mt-[20vh] lg:flex-[0.85]">
              <div className="aspect-[3/4] w-[85%] rounded bg-[#111111]/10" />
            </div>
            <div className="w-full shrink-0 lg:w-[30vw] lg:max-w-[480px]">
              <div className="aspect-[4/5] w-full rounded bg-[#111111]/10" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
