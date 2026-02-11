"use client";

import Link from "next/link";
import { Badge } from "@/src/components/ui/badge";
import { ArrowRight } from "lucide-react";

export function BlogRecentArticles({ posts, lastUpdate, hasMore }) {
  if (!posts.length) return null;

  return (
    <section className="px-5 pt-10 pb-8 lg:pt-20 lg:pb-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left: Title & description */}
          <div className="lg:sticky lg:top-24 lg:self-start lg:w-2/5 shrink-0 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-medium text-gray-900 mb-6">
              Nos articles les plus recents
            </h2>
            <p className="text-base text-gray-600 mb-4">
              {
                "Retrouvez nos derniers articles sur la facturation, la gestion d'entreprise et les bonnes pratiques pour les independants."
              }
            </p>
            <p className="text-xs text-gray-400">
              {"Derniere mise a jour : "}
              {lastUpdate}
            </p>
          </div>

          {/* Right: Article cards */}
          <div className="flex flex-col gap-12 lg:w-3/5">
            {posts.map((post) => (
              <article key={post.slug}>
                <Link href={post.url} className="group block">
                  <figure className="relative overflow-hidden mb-6 aspect-[312/188] lg:aspect-[384/232] rounded-lg">
                    <div className="w-full h-full bg-gradient-to-br from-[#5a50ff]/10 to-[#8b7fff]/20">
                      {post.image && (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                  </figure>
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="pending" className="text-xs uppercase">
                      {post.category}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {post.readTime} min
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-2 group-hover:text-[#5a50ff] transition-colors">
                    {post.title}
                  </h3>
                </Link>
                <div className="flex items-center text-xs text-gray-500">
                  <span>{post.publishDate}</span>
                  <span className="mx-2 inline-block w-1 h-1 bg-gray-400 rounded-full" />
                  <span>Par {post.author}</span>
                </div>
              </article>
            ))}

            {hasMore && (
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-[#5a50ff] transition-colors group pt-4"
              >
                <span>Voir plus</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
