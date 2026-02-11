"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils";

interface TocItem {
  id: string;
  text: string;
}

interface BlogArticleLayoutProps {
  children: React.ReactNode;
  title: string;
  slug: string;
}

export function BlogArticleLayout({
  children,
  title,
  slug,
}: BlogArticleLayoutProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [navHeight, setNavHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Measure navbar height dynamically
  useEffect(() => {
    const measure = () => {
      const nav = document.querySelector("header nav");
      if (nav) {
        setNavHeight(nav.getBoundingClientRect().height);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Extract h2 headings from rendered content
  useEffect(() => {
    if (!contentRef.current) return;

    const headings = contentRef.current.querySelectorAll("h2[id]");
    const items: TocItem[] = Array.from(headings).map((h) => ({
      id: h.id,
      text: h.textContent || "",
    }));
    setTocItems(items);
  }, [children]);

  // Track scroll for active heading + progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);

      if (!contentRef.current) return;
      const headings = contentRef.current.querySelectorAll("h2[id]");
      let current = "";

      for (const heading of headings) {
        const el = heading as HTMLElement;
        if (el.offsetTop - 120 <= scrollTop) {
          current = el.id;
        }
      }
      setActiveId(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {/* Progress bar — overlaps navbar border-bottom exactly */}
      {navHeight > 0 && (
        <div
          className="fixed left-0 w-full h-[2px] z-[101] pointer-events-none"
          style={{ top: `${navHeight - 1}px` }}
        >
          <div
            className="h-full bg-[#5a50ff] transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Breadcrumb — same wrapper structure as navbar for perfect alignment */}
      <div
        className="w-full px-6 lg:px-12"
        style={{ paddingTop: `${navHeight + 16}px` }}
      >
        <nav aria-label="Fil d'ariane" className="max-w-7xl mx-auto pb-14">
          <ol className="flex items-center gap-1.5 text-xs text-gray-500">
            <li>
              <Link
                href="/"
                className="hover:text-[#5a50ff] transition-colors"
              >
                Accueil
              </Link>
            </li>
            <li className="text-gray-300">/</li>
            <li>
              <Link
                href="/blog"
                className="hover:text-[#5a50ff] transition-colors"
              >
                Blog
              </Link>
            </li>
            <li className="text-gray-300">/</li>
            <li className="text-gray-900 font-medium truncate max-w-[250px]">
              {title}
            </li>
          </ol>
        </nav>
      </div>

      {/* Main layout: TOC + Content */}
      <div className="w-full px-6 lg:px-12">
        <div className="max-w-7xl mx-auto pb-16">
          <div className="flex gap-16 lg:gap-20">
            {/* Sticky TOC - left */}
            {tocItems.length > 0 && (
              <aside className="hidden lg:block w-[200px] shrink-0">
                <div
                  className="sticky"
                  style={{ top: `${navHeight + 16}px` }}
                >
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                    Sommaire
                  </p>
                  <nav>
                    <ul className="space-y-1">
                      {tocItems.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => scrollToHeading(item.id)}
                            className={cn(
                              "text-left text-xs leading-relaxed py-1.5 pl-3 border-l-2 w-full transition-colors",
                              activeId === item.id
                                ? "border-[#5a50ff] text-[#5a50ff] font-medium"
                                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                            )}
                          >
                            {item.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </aside>
            )}

            {/* Article content */}
            <div className="flex-1 min-w-0" ref={contentRef}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
