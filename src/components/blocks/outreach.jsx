import React from "react";

const OutreachSection = () => {
  return (
    <div className="mx-2 mt-20 rounded-[15px] md:rounded-[20px] lg:rounded-[20px] bg-gray-900 py-32">
      <div className="px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-7xl">
          <h2
            data-dark="true"
            className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase data-dark:text-gray-400"
          >
            Outreach
          </h2>
          <h3
            data-dark="true"
            className="mt-2 max-w-3xl text-2xl font-medium tracking-tighter text-pretty text-gray-950 data-dark:text-white sm:text-4xl"
          >
            Customer outreach has never been easier.
          </h3>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
            <div
              data-dark="true"
              className="max-lg:rounded-t-4xl lg:col-span-4 lg:rounded-tl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 data-dark:bg-gray-800 data-dark:ring-white/15"
            >
              <div className="relative h-60 shrink-0">
                <div className="h-60 bg-[url('/screenshots/networking.png')] bg-size-[851px_344px] bg-no-repeat"></div>
                <div className="absolute inset-0 bg-linear-to-b from-white to-50% group-data-dark:from-gray-800 group-data-dark:from-[-25%]"></div>
              </div>
              <div className="relative p-6">
                <h3
                  data-dark="true"
                  className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase data-dark:text-gray-400"
                >
                  Networking
                </h3>
                <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 group-data-dark:text-white">
                  Sell at the speed of light
                </p>
                <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 group-data-dark:text-gray-400">
                  Our RadiantAI chat assistants analyze the sentiment of your
                  conversations in real time, ensuring you're always one step
                  ahead.
                </p>
              </div>
            </div>
            <div
              data-dark="true"
              className="z-10 overflow-visible! lg:col-span-2 lg:rounded-tr-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 data-dark:bg-gray-800 data-dark:ring-white/15"
            >
              <div className="relative h-60 shrink-0">
                <div
                  aria-hidden="true"
                  className="relative h-full overflow-hidden"
                >
                  <div className="absolute inset-0 top-8 z-10 flex items-center justify-center">
                    <div
                      className="absolute inset-0 backdrop-blur-md"
                      style={{
                        maskImage:
                          "url('data:image/svg+xml,<svg width=&quot;96&quot; height=&quot;96&quot; viewBox=&quot;0 0 96 96&quot; fill=&quot;none&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><rect width=&quot;96&quot; height=&quot;96&quot; rx=&quot;12&quot; fill=&quot;black&quot;/></svg>')",
                        maskPosition: "center",
                        maskRepeat: "no-repeat",
                      }}
                    ></div>
                    <div className="relative flex size-24 items-center justify-center rounded-xl bg-linear-to-t from-white/5 to-white/25 shadow-sm ring-1 ring-white/10 outline outline-offset-[-5px] outline-white/5 ring-inset">
                      <svg
                        viewBox="0 0 34 34"
                        fill="none"
                        className="h-9 fill-white"
                      >
                        <path d="M19.598 18.5C18.7696 19.9349 16.9348 20.4265 15.4999 19.5981C14.065 18.7696 13.5734 16.9349 14.4018 15.5C15.2303 14.0651 17.065 13.5735 18.4999 14.4019C19.9348 15.2303 20.4264 17.0651 19.598 18.5Z"></path>
                        <path d="M23.232 10.2058C22.6797 11.1623 21.4565 11.4901 20.4999 10.9378C19.5433 10.3855 19.2156 9.16235 19.7679 8.20576C20.3201 7.24918 21.5433 6.92143 22.4999 7.47371C23.4565 8.026 23.7842 9.24918 23.232 10.2058Z"></path>
                        <path d="M19.7679 25.7944C19.2156 24.8378 19.5433 23.6146 20.4999 23.0623C21.4565 22.51 22.6797 22.8378 23.232 23.7944C23.7843 24.7509 23.4565 25.9741 22.4999 26.5264C21.5433 27.0787 20.3202 26.7509 19.7679 25.7944Z"></path>
                        <path d="M25.9999 19.0001C24.8953 19.0001 23.9999 18.1047 23.9999 17.0001C23.9999 15.8956 24.8953 15.0001 25.9999 15.0001C27.1045 15.0001 27.9999 15.8956 27.9999 17.0001C27.9999 18.1047 27.1045 19.0001 25.9999 19.0001Z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="@container absolute inset-0 grid grid-cols-1 pt-8">
                  <div className="group relative">
                    <div className="[animation-delay:-20s] [animation-duration:40s] absolute top-2 grid grid-cols-[1rem_1fr] items-center gap-2 px-3 py-1 whitespace-nowrap rounded-full bg-linear-to-t from-gray-800 from-50% to-gray-700 ring-1 ring-white/10 ring-inset [--move-x-from:-100%] [--move-x-to:calc(100%+100cqw)] [animation-iteration-count:infinite] [animation-name:move-x] [animation-play-state:paused] group-hover:[animation-play-state:running]">
                      <img
                        alt=""
                        src="/logo-timeline/loom.svg"
                        className="size-4"
                      />
                      <span className="text-sm/6 font-medium text-white">
                        Loom
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative p-6">
                <h3
                  data-dark="true"
                  className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase data-dark:text-gray-400"
                >
                  Integrations
                </h3>
                <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 group-data-dark:text-white">
                  Meet leads where they are
                </p>
                <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 group-data-dark:text-gray-400">
                  With thousands of integrations, no one will be able to escape
                  your cold outreach.
                </p>
              </div>
            </div>
            <div
              data-dark="true"
              className="lg:col-span-2 lg:rounded-bl-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 data-dark:bg-gray-800 data-dark:ring-white/15"
            >
              <div className="relative h-60 shrink-0">
                <div className="h-60 bg-[url('/screenshots/engagement.png')] bg-size-[851px_344px] bg-no-repeat"></div>
                <div className="absolute inset-0 bg-linear-to-b from-white to-50% group-data-dark:from-gray-800 group-data-dark:from-[-25%]"></div>
              </div>
              <div className="relative p-6">
                <h3
                  data-dark="true"
                  className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase data-dark:text-gray-400"
                >
                  Engagement
                </h3>
                <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 group-data-dark:text-white">
                  Become a thought leader
                </p>
                <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 group-data-dark:text-gray-400">
                  RadiantAI automatically writes LinkedIn posts that relate
                  current events to B2B sales, helping you build a reputation as
                  a thought leader.
                </p>
              </div>
            </div>
            <div
              data-dark="true"
              className="lg:col-span-4 lg:rounded-br-4xl group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-black/5 data-dark:bg-gray-800 data-dark:ring-white/15"
            >
              <div className="relative h-60 shrink-0">
                <div className="h-60 bg-[url('/screenshots/analytics.png')] bg-size-[851px_344px] bg-no-repeat"></div>
                <div className="absolute inset-0 bg-linear-to-b from-white to-50% group-data-dark:from-gray-800 group-data-dark:from-[-25%]"></div>
              </div>
              <div className="relative p-6">
                <h3
                  data-dark="true"
                  className="font-mono text-xs/5 font-semibold tracking-widest text-gray-500 uppercase data-dark:text-gray-400"
                >
                  Analytics
                </h3>
                <p className="mt-1 text-2xl/8 font-medium tracking-tight text-gray-950 group-data-dark:text-white">
                  Track your performance
                </p>
                <p className="mt-2 max-w-[600px] text-sm/6 text-gray-600 group-data-dark:text-gray-400">
                  Comprehensive analytics dashboard helps you monitor engagement metrics and optimize your outreach strategy for maximum impact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutreachSection;
