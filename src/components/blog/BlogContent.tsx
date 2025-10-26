import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Callout } from "./Callout";
import Image from "next/image";

interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // Titres
        h2: ({ children }) => (
          <h2 className="text-xl font-medium tracking-tight text-gray-900 mt-10 mb-5">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-medium text-gray-800 mt-7 mb-3">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-base font-semibold text-gray-800 mt-5 mb-2">
            {children}
          </h4>
        ),

        // Paragraphes
        p: ({ children }) => (
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            {children}
          </p>
        ),

        // Liens
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-[#5a50ff] no-underline font-normal hover:underline"
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {children}
          </a>
        ),

        // Strong
        strong: ({ children }) => (
          <strong className="text-gray-900 font-medium">{children}</strong>
        ),

        // Listes non ordonnées
        ul: ({ children }) => <ul className="my-4 space-y-2">{children}</ul>,

        // Listes ordonnées
        ol: ({ children }) => (
          <ol className="my-4 space-y-2 list-decimal list-inside marker:text-[#5a50ff] marker:font-medium">
            {children}
          </ol>
        ),

        // Items de liste
        li: ({ children }) => (
          <li className="text-sm text-gray-600 leading-relaxed pl-2">
            {children}
          </li>
        ),

        // Code inline
        code: ({ children }) => (
          <code className="text-[#5a50ff] bg-[#5a50ff]/5 px-1.5 py-0.5 rounded font-normal text-sm">
            {children}
          </code>
        ),

        // Blocs de code
        pre: ({ children }) => (
          <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-x-auto my-6">
            {children}
          </pre>
        ),

        // Images
        img: ({ src, alt }) => (
          <div className="my-6">
            <img
              src={src}
              alt={alt || ""}
              className="rounded-lg shadow-md w-full"
            />
            {alt && (
              <p className="text-sm text-gray-500 mt-2 text-center italic">
                {alt}
              </p>
            )}
          </div>
        ),

        // Tableaux
        table: ({ children }) => (
          <div className="bg-gray-50 p-6 rounded-lg my-6 border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-gray-200">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className="text-gray-700">
            {children}
          </tbody>
        ),
        tr: ({ children }) => (
          <tr className="border-b border-gray-200">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="pb-2 text-left font-medium text-gray-900">
            {children}
          </th>
        ),
        td: ({ children }) => <td className="py-3">{children}</td>,

        // Blockquotes (pour les callouts)
        blockquote: ({ children, node }: any) => {
          // Extraire le texte brut pour détecter le type
          const extractText = (node: any): string => {
            if (typeof node === "string") return node;
            if (Array.isArray(node)) return node.map(extractText).join("");
            if (node?.props?.children) return extractText(node.props.children);
            return "";
          };

          const textContent = extractText(children);
          let type:
            | "info"
            | "warning"
            | "success"
            | "tip"
            | "danger"
            | "neutral" = "neutral";

          // Détection plus précise
          if (
            textContent.includes("Le saviez-vous") ||
            textContent.includes("[!TIP]")
          ) {
            type = "tip";
          } else if (
            textContent.includes("Erreur à éviter") ||
            textContent.includes("[!WARNING]")
          ) {
            type = "warning";
          } else if (
            textContent.includes("Astuce pro") ||
            textContent.includes("[!SUCCESS]")
          ) {
            type = "success";
          } else if (textContent.includes("[!DANGER]")) {
            type = "danger";
          } else if (textContent.includes("[!INFO]")) {
            type = "info";
          }

          return (
            <div className="my-6">
              <Callout type={type}>{children}</Callout>
            </div>
          );
        },

        // Vidéos
        video: ({ src, children, ...props }: any) => (
          <video 
            className="w-full rounded-lg shadow-md my-6"
            {...props}
          >
            {children}
          </video>
        ),
        
        // Source pour les vidéos
        source: ({ src, type }: any) => (
          <source src={src} type={type} />
        ),
        
        // Divs personnalisées (pour les grilles, etc.)
        div: ({ className, children }: any) => {
          if (className?.includes('grid')) {
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-6 [&>div]:my-0">
                {children}
              </div>
            );
          }
          return <div className={className}>{children}</div>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
