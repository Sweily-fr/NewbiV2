import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Callout } from "@/src/components/ui/callout";
import { Badge } from "@/src/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import type { MDXComponents } from "mdx/types";

function SmartLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (!href) return <span {...props}>{children}</span>;

  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a
        href={href}
        className="text-[#5a50ff] no-underline font-normal hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="text-[#5a50ff] no-underline font-normal hover:underline"
      {...props}
    >
      {children}
    </Link>
  );
}

export function getMDXComponents(): MDXComponents {
  return {
    // Next.js components
    Image,
    Link: SmartLink as any,

    // UI components used in MDX files
    Button,
    Callout,
    Badge,
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Alert,
    AlertDescription,
    AlertTitle,

    // Lucide icons
    Check,

    // HTML element overrides
    h2: ({ children, ...props }: any) => {
      const text = typeof children === "string" ? children : "";
      const id = text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      return (
        <h2
          id={id}
          className="text-xl font-medium tracking-tight text-gray-900 mt-10 mb-5"
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: any) => (
      <h3
        className="text-lg font-medium text-gray-800 mt-7 mb-3"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4
        className="text-base font-semibold text-gray-800 mt-5 mb-2"
        {...props}
      >
        {children}
      </h4>
    ),
    p: ({ children, ...props }: any) => (
      <p
        className="text-sm text-gray-600 leading-relaxed mb-3"
        {...props}
      >
        {children}
      </p>
    ),
    a: SmartLink as any,
    strong: ({ children, ...props }: any) => (
      <strong className="text-gray-900 font-medium" {...props}>
        {children}
      </strong>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="my-4 space-y-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol
        className="my-4 space-y-2 list-decimal list-inside marker:text-[#5a50ff] marker:font-medium"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="text-sm text-gray-600 leading-relaxed pl-2" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }: any) => (
      <div className="my-6">
        <Callout type="info">{children}</Callout>
      </div>
    ),
    code: ({ children, ...props }: any) => (
      <code
        className="text-[#5a50ff] bg-[#5a50ff]/5 px-1.5 py-0.5 rounded font-normal text-sm"
        {...props}
      >
        {children}
      </code>
    ),
    pre: ({ children, ...props }: any) => (
      <pre
        className="bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-x-auto my-6"
        {...props}
      >
        {children}
      </pre>
    ),
    hr: (props: any) => (
      <hr
        className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8 border-0"
        {...props}
      />
    ),
    figure: ({ children, ...props }: any) => (
      <figure className="my-8" {...props}>
        {children}
      </figure>
    ),
    figcaption: ({ children, ...props }: any) => (
      <figcaption
        className="mt-2 text-center text-sm text-gray-500 italic"
        {...props}
      >
        {children}
      </figcaption>
    ),
  };
}
