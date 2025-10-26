import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

const BlogGrid = ({ posts = [] }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        {/* <Badge className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap">
          Articles
        </Badge> */}
        <h1 className="text-balance text-4xl font-medium">
          Découvrez les dernières tendances
        </h1>
        <p className="text-muted-foreground">
          Explorez notre blog pour des articles perspicaces, des réflexions
          personnelles et des idées qui inspirent l'action sur les sujets qui
          vous tiennent à cœur.
        </p>
        <Link
          href="#"
          className="flex items-center gap-1 text-sm font-semibold"
        >
          Voir tous les articles
          <ChevronRight className="h-full w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={post.url} className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-[#5a50ff]/5 to-[#8b7fff]/10 p-6 transition-all hover:border-[#5a50ff]/20 hover:from-[#5a50ff]/10 hover:to-[#8b7fff]/15">
              {/* Badge catégorie */}
              <Badge className="mb-4 border-[#5a50ff]/20 bg-[#5a50ff]/10 text-[#5a50ff] text-xs px-2 py-0.5">
                {post.label}
              </Badge>

              {/* Contenu */}
              <div className="space-y-3">
                <h2 className="text-lg font-medium text-gray-900 line-clamp-2 group-hover:text-[#5a50ff] transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {post.summary || post.description}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  {post.published}
                </span>
                <span className="flex items-center gap-1 text-[#5a50ff] group-hover:text-[#5a50ff]/80 transition-colors">
                  Lire plus
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export { BlogGrid };
