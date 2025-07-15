import HomeNavbar from "../components/HomeNavbar";
import Footer from "../components/Footer";
import Image from "next/image";

const flags = [
  { src: "/assets/flags.png", name: "World Wide", path: "/" },
  { src: "/assets/ghana-circle.png", name: "Ghana", path: "/gh" },
  { src: "/assets/nigeria-cirle.png", name: "Nigeria", path: "/ng" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <HomeNavbar />
      <main className="max-w-7xl mx-auto px-4 py-10 flex flex-col items-center flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
          No Bias. No Hype.
        </h1>
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
          Just Betting Options.
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Booldo is built to help you bet smarter. We show you all the top bookmakers and offers, even those we<br />
          don't partner with, so you can decide with confidence. No noisy tips. No clutter. Just clear, honest info.
        </p>
        <div className="flex flex-col gap-4 w-full">
          {flags.filter(flag => flag.name !== "World Wide").map((flag) => (
            <div
              key={flag.name}
              className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-gray-200 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <Image src={flag.src} alt={flag.name} width={36} height={36} className="rounded-full" />
                <div>
                  <div className="font-semibold text-gray-900">{flag.name}</div>
                  <div className="text-sm text-gray-500">Discover local offers and bookies</div>
                </div>
              </div>
              <a
                href={flag.path}
                className="inline-flex items-center text-sm font-semibold text-gray-900 hover:underline"
              >
                View Offers
                <svg className="ml-1" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}