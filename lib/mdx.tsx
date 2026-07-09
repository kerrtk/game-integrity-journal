import { MDXRemote } from "next-mdx-remote/rsc"
import { mdxComponents } from "@/components/mdx-components"

export function ArticleBody({ source }: { source: string }) {
  return (
    <div className="prose-article">
      <MDXRemote source={source} components={mdxComponents} />
    </div>
  )
}
