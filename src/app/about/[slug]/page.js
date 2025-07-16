"use client";
import { useParams } from "next/navigation";
import HomeNavbar from "../../../components/HomeNavbar";
import Footer from "../../../components/Footer";
import Link from "next/link";

const articles = [
  {
    title: "What are Karibu Bonuses and What is there for You?",
    img: "/assets/karibu.jpg",
  },
  {
    title: "Tennis: The Easiest Sport to Bet On... Or Is It?",
    img: "/assets/tennis-prediction.jpg",
  },
  {
    title: "Christmas Countdown Top Festive Betting Offers to Light Up Your Holidays!",
    img: "/assets/christmascalendar.jpg",
  },
  {
    title: "Sports Gambling Hacks with The African Twist",
    img: "/assets/betting-hacks.jpg",
  },
  {
    title: "Surebets Explained: A Path to Risk-Free Betting",
    img: "/assets/moneybag.jpg",
  },
  {
    title: "What is Point Spread Betting?",
    img: "/assets/stadium.jpg",
  },
  {
    title: "Unlocking Correct Score Prediction Strategies",
    img: "/assets/Correct-Score-Predictions.jpg",
  },
  {
    title: "What is a Leaderboard in Sports Betting?",
    img: "/assets/sports-betting-leaderboard.jpg",
  },
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function ArticlePage() {
  const { slug } = useParams();
  const article = articles.find(a => slugify(a.title) === slug);
  const sidebarArticles = articles;
  const readMoreArticles = articles.filter(a => slugify(a.title) !== slug).slice(0, 3);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafbfc]">
        <HomeNavbar />
        <main className="flex-1 max-w-4xl mx-auto py-16 px-4">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <p>The article you are looking for does not exist.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <HomeNavbar />
      <main className="flex-1 max-w-6xl mx-auto py-10 px-4 w-full">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Article Content */}
          <div className="flex-1">
            <img src={article.img} alt={article.title} className="w-full max-w-xl rounded-lg mb-6" />
            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
            <div className="text-gray-700 text-base space-y-4 mb-8">
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque. Etiam euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque.</p>
              <p>Aliquam erat volutpat. Etiam euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque. Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque.</p>
              <p>Morbi euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque. Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque.</p>
            </div>
          </div>
          {/* Sidebar */}
          <aside className="w-full md:w-80 flex-shrink-0">
            <div className="flex flex-col gap-4">
              {sidebarArticles.map((a, idx) => {
                const isActive = slugify(a.title) === slug;
                return (
                  <Link
                    key={idx}
                    href={`/about/${slugify(a.title)}`}
                    className={`flex gap-3 items-center bg-white rounded-lg shadow-sm p-2 transition hover:shadow-lg hover:scale-[1.03] cursor-pointer ${isActive ? "border-2 border-green-600" : ""}`}
                  >
                    <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                      <img src={a.img} alt={a.title} className="object-cover w-full h-full" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {a.title}
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
        {/* Read More Section */}
        <hr className="my-10 border-gray-200" />
        <div className="flex items-center gap-2 mb-6">
          <span className="text-green-700 text-2xl">●</span>
          <h2 className="text-2xl font-bold">Read More</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          {readMoreArticles.map((a, idx) => (
            <Link
              key={idx}
              href={`/about/${slugify(a.title)}`}
              className="flex flex-col items-center bg-white rounded-lg shadow-sm p-4 transition hover:shadow-lg hover:scale-[1.03] cursor-pointer"
            >
              <div className="w-32 h-32 rounded overflow-hidden bg-gray-100 mb-3">
                <img src={a.img} alt={a.title} className="object-cover w-full h-full" />
              </div>
              <div className="text-base font-semibold text-gray-900 leading-tight text-center">
                {a.title}
              </div>
              <span className="mt-2 px-3 py-1 bg-green-700 text-white text-xs rounded">Briefly</span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
} 