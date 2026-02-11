"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/src/components/ui/badge";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

export function BlogHeroSlider({ posts }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % posts.length);
  }, [posts.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + posts.length) % posts.length);
  }, [posts.length]);

  useEffect(() => {
    if (posts.length <= 1) return;
    const interval = setInterval(goNext, 7000);
    return () => clearInterval(interval);
  }, [goNext, posts.length]);

  if (!posts.length) return null;

  return (
    <section className="relative px-5 my-10 md:my-20">
      <div className="absolute right-0 left-0 -bottom-10 mx-auto w-full border-b border-gray-200 max-w-[1200px] md:-bottom-20" />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="grid grid-cols-12 gap-6 items-center">
          {/* Text content */}
          <div className="order-2 col-span-12 md:col-span-7 lg:col-span-6 md:order-1">
            <div className="relative pb-8 min-h-[220px] md:min-h-[260px]">
              {posts.map((post, index) => (
                <div
                  key={post.slug}
                  className={`flex flex-col gap-4 justify-center transition-all duration-500 ${
                    index === activeIndex
                      ? "opacity-100 relative"
                      : "opacity-0 absolute inset-0 pointer-events-none"
                  }`}
                >
                  <p className="flex gap-2 items-center">
                    <Badge variant="pending" className="text-xs uppercase">
                      {post.category}
                    </Badge>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">
                      {post.readTime} min
                    </span>
                  </p>
                  <h2 className="text-2xl md:text-3xl font-medium text-gray-900 leading-tight">
                    {post.title}
                  </h2>
                  <p className="text-base md:text-lg text-gray-600 leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                  <Link
                    href={post.url}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-[#5a50ff] transition-colors group w-fit"
                  >
                    <span>{"Lire l'article"}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              ))}
            </div>
            {posts.length > 1 && (
              <div className="flex gap-4">
                <button
                  onClick={goPrev}
                  className="flex justify-center items-center w-[52px] h-[52px] rounded-md bg-gray-900 text-white hover:bg-[#5a50ff] transition-colors"
                  aria-label="Article precedent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goNext}
                  className="flex justify-center items-center w-[52px] h-[52px] rounded-md bg-gray-900 text-white hover:bg-[#5a50ff] transition-colors"
                  aria-label="Article suivant"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Image */}
          <div className="order-1 col-span-12 md:col-span-5 lg:col-span-6 md:order-2">
            <div className="relative overflow-hidden rounded-lg aspect-[16/10]">
              {posts.map((post, index) => (
                <div
                  key={post.slug}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === activeIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-[#5a50ff]/10 to-[#8b7fff]/20 rounded-lg">
                    {post.image && (
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
