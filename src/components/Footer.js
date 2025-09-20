"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { client } from "../sanity/lib/client";
import { urlFor } from "../sanity/lib/image";
import { PortableText } from "@portabletext/react";

// Skeleton loading component for footer
function FooterSkeleton() {
  return (
    <footer className="bg-[#f6f7f9] w-full px-4 pt-8 pb-4 text-gray-700 text-sm mt-8">
      <div className="w-full flex flex-col gap-4">
        {/* Social Media Skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
          <div className="flex gap-4 mb-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-7 h-7 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
          <hr className="border-gray-300 my-2" />
        </div>

        {/* Navigation Links Skeleton */}
        <div className="flex flex-col gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 rounded w-16 animate-pulse"
            ></div>
          ))}
        </div>
        <hr className="border-gray-300 my-2" />

        {/* Content Sections Skeleton */}
        {[1, 2, 3].map((section) => (
          <div key={section}>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
            <hr className="border-gray-300 my-2" />
          </div>
        ))}

        {/* Bottom Row Skeleton */}
        <div className="flex flex-wrap items-center text-xs text-gray-400 mt-4 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-3 bg-gray-200 rounded w-12 animate-pulse"
            ></div>
          ))}
          <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </div>
    </footer>
  );
}

export default function Footer() {
  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to get hamburger menu item URL
  const getHamburgerItemUrl = (label) => {
    return `/hamburger-menu/${label
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")}`;
  };

  // Helper function to get menu item URL based on type
  const getMenuItemUrl = (item) => {
    if (item.type === "hamburger" && item.hamburgerMenuItem) {
      return "/hamburger-menu/main";
    }

    const urls = {
      home: "/",
      blog: "/briefly",
      calculators: "/calculators",
      faq: "/faq",
    };

    return urls[item.type] || "#";
  };

  // Helper function to get menu item label based on type
  const getMenuItemLabel = (item) => {
    if (item.type === "hamburger" && item.hamburgerMenuItem) {
      return item.hamburgerMenuItem.title;
    }

    const labels = {
      home: "Home",
      blog: "Blog",
      calculators: "Calculators",
      faq: "FAQ",
    };

    return labels[item.type] || item.type;
  };

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const data =
          await client.fetch(`*[_type == "footer" && isActive == true][0]{
            socialMedia,
            navigationLinks{
              menuItems[]{
                type,
                hamburgerMenuItem->{
                  _id,
                  title
                },
                isActive
              }
            },
            affiliateDisclosure,
            responsibleGambling,
            gamblingResources,
            bottomRowLinks{
              links[]{
                label,
                slug,
                url,
                isActive,
                noindex,
                sitemapInclude
              },
              copyrightText
            }
          }`);

        setFooterData(data);
      } catch (error) {
        console.error("Error fetching footer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFooterData();
  }, []);

  if (loading) {
    return <FooterSkeleton />;
  }

  return (
    <footer className="bg-[#f6f7f9] w-full px-4 pt-8 pb-4 text-gray-700 text-sm mt-8  tracking-[1%]">
      <div className="w-full flex flex-col gap-4">
        {/* Socials */}
        {footerData?.socialMedia?.isActive && (
          <div>
            <div className="mb-2  font-medium text-[14px] leading-[100%] tracking-[1%] text-[#272932]">
              {footerData.socialMedia.title || "Follow us on"}
            </div>
            <div className="flex gap-4 mb-3">
              {footerData.socialMedia.platforms?.map(
                (platform, index) =>
                  platform.isActive && (
                    <a
                      key={index}
                      href={platform.url}
                      aria-label={platform.name}
                      className="hover:opacity-80"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {platform.icon ? (
                        <Image
                          src={urlFor(platform.icon).width(28).height(28).url()}
                          alt={platform.name}
                          width={28}
                          height={28}
                        />
                      ) : (
                        <img
                          src="/assets/x.png"
                          alt={platform.name}
                          width={28}
                          height={28}
                        />
                      )}
                    </a>
                  )
              )}
            </div>
            <hr className="border-gray-300 my-2" />
          </div>
        )}

        {/* Links */}
        {footerData?.navigationLinks?.menuItems && (
          <div>
            <div className="flex flex-col gap-1">
              {footerData.navigationLinks.menuItems.map(
                (item, index) =>
                  item.isActive &&
                  getMenuItemUrl(item) && (
                    <div key={index}>
                      {/* Main menu item */}
                      <a
                        href={getMenuItemUrl(item)}
                        className=" font-medium text-[14px] leading-[100%] tracking-[1%] text-[#272932]"
                      >
                        {getMenuItemLabel(item)}
                      </a>
                    </div>
                  )
              )}
            </div>
            <hr className="border-gray-300 my-2" />
          </div>
        )}

        {/* Affiliate Disclosure */}
        {footerData?.affiliateDisclosure?.isActive && (
          <div>
            <div>
              <div className="font-semibold mb-1 font-['General_Sans']">
                {footerData.affiliateDisclosure.title || "Affiliate Disclosure"}
              </div>
              <div className="text-xs text-gray-600 font-['General_Sans']">
                {footerData.affiliateDisclosure.content ? (
                  <PortableText value={footerData.affiliateDisclosure.content} />
                ) : (
                  <>
                    Booldo is an independent sports betting affiliate site. We may
                    earn a commission if you register or place a bet through some
                    of the links on our site. <br />
                    This does not influence which bookmakers or offers we feature
                    – our team includes all available offers based on relevance,
                    not commercial <br />
                    agreements. We strive to provide up-to-date licensing
                    information for each bookie.
                  </>
                )}
              </div>
            </div>
            <hr className="border-gray-300 my-2" />
          </div>
        )}

        {/* Responsible Gambling */}
        {footerData?.responsibleGambling?.isActive && (
          <div>
            <div>
              <div className="font-semibold mb-1 font-['General_Sans']">
                {footerData.responsibleGambling.title || "Responsible Gambling"}
              </div>
              <div className="text-xs text-gray-600 font-['General_Sans']">
                {footerData.responsibleGambling.content ? (
                  <PortableText value={footerData.responsibleGambling.content} />
                ) : (
                  <>
                    Betting should be an entertainment, not a solution to
                    financial problems. Always be responsible. If you or someone
                    you know is struggling with <br />
                    gambling, please seek help from local support services.
                  </>
                )}
              </div>
            </div>
            <hr className="border-gray-300 my-2" />
          </div>
        )}

        {/* Resources */}
        {footerData?.gamblingResources && (
          <div>
            <div className="font-['General_Sans']">
              <div className="mb-1 font-['General_Sans']">
                {footerData.gamblingResources.title ||
                  "Need help? Visit these responsible gambling resources"}
              </div>
              {footerData.gamblingResources.resources &&
              footerData.gamblingResources.resources.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {footerData.gamblingResources.resources.map(
                    (resource, index) =>
                      resource &&
                      resource.isActive && (
                        <li key={index}>
                          <a
                            href={resource.url}
                            className=" font-medium text-[14px] leading-[100%] tracking-[1%] text-[#272932] underline decoration-solid decoration-0 decoration-auto"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {resource.name}
                          </a>
                        </li>
                      )
                  )}
                </ul>
              ) : (
                <div className="text-xs text-gray-600 font-['General_Sans']">
                  <a
                    href="https://www.gamblersanonymous.org"
                    className=" font-medium text-[14px] leading-[100%] tracking-[1%] text-[#272932] underline decoration-solid decoration-0 decoration-auto"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span> Gamblers Anonymous</span>
                  </a>
                  <br />
                  <a
                    href="https://www.ncpgambling.org"
                    className=" font-medium text-[14px] leading-[100%] tracking-[1%] text-[#272932] underline decoration-solid decoration-0 decoration-auto"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    National Council on Problem Gambling
                  </a>
                  <br />
                  <a
                    href="https://www.begambleaware.org"
                    className=" font-medium text-[14px] leading-[100%] tracking-[1%] text-[#272932] underline decoration-solid decoration-0 decoration-auto"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    BeGambleAware
                  </a>
                </div>
              )}
            </div>
            <hr className="border-gray-300 my-2" />
          </div>
        )}

        {/* Bottom row */}
        <div className="flex flex-wrap font-['General_Sans'] items-center justify-center text-xs text-gray-400 mt-4 gap-4">
          {footerData?.bottomRowLinks?.links?.map((link, index) => {
            if (
              !link.isActive ||
              link.noindex === true ||
              link.sitemapInclude === false
            )
              return null;
            const hasInternalContent =
              link?.slug?.current && link?.content && link.content.length > 0;
            if (hasInternalContent) {
              return (
                <Link
                  key={index}
                  href={`/footer/${link.slug.current}`}
                  className="hover:underline  font-medium text-[12px] leading-[100%] tracking-[1%] text-[#272932]"
                >
                  {link.label}
                </Link>
              );
            }
            return (
              <a
                key={index}
                href={link.url || "#"}
                className="hover:underline font-['General_Sans'] font-medium text-[12px] leading-[100%] tracking-[1%] text-[#272932]"
              >
                {link.label}
              </a>
            );
          })}
          <span className="font-['General_Sans']">
            {footerData?.bottomRowLinks?.copyrightText ||
              "© Copyright 2025 BOOLDO"}
          </span>
        </div>
      </div>
    </footer>
  );
}
