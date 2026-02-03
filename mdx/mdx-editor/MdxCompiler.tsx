import { compile } from "@mdx-js/mdx";
import * as runtime from "react/jsx-dev-runtime";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

/**
 * Preprocess source to normalize display-math like Obsidian:
 * - Treat any $$...$$ (even on one line) as a display block
 * - Also support the common $$$$...$$$$ form by collapsing to $$...$$
 * - Skip code fences so code examples remain untouched
 */
function preprocessForMath(source: string): string {
  // Split on fenced code blocks (``` or ~~~) to avoid transforming inside them
  const fenceRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;
  const parts = source.split(fenceRegex);

  const transform = (segment: string) => {
    // First, handle the $$$$...$$$$ variant
    let s = segment.replace(/\$\$\$\$([\s\S]*?)\$\$\$\$/g, (_m, content) => {
      const body = String(content).trim();
      return `\n\n$$\n${body}\n$$\n\n`;
    });

    // Then, handle plain $$...$$ (but ensure we don't match $$$ or $$$$ using lookarounds)
    s = s.replace(/(?<!\$)\$\$([\s\S]*?)\$\$(?!\$)/g, (_m, content) => {
      const body = String(content).trim();
      return `\n\n$$\n${body}\n$$\n\n`;
    });

    return s;
  };

  for (let i = 0; i < parts.length; i++) {
    // Odd indices are code fences due to split capture; leave them as-is
    if (i % 2 === 0) {
      parts[i] = transform(parts[i]);
    }
  }

  return parts.join("");
}

export async function compileMdx(source: string) {
  // Handle empty or whitespace-only content
  if (!source || !source.trim()) {
    return {
      default: () => null,
    };
  }

  try {
    // Preprocess to fix math block spacing
    const preprocessed = preprocessForMath(source);

    const compiled = await compile(preprocessed, {
      outputFormat: "function-body",
      development: true,
      remarkPlugins: [remarkGfm, remarkDirective, remarkMath],
      rehypePlugins: [
        [
          rehypeKatex,
          {
            strict: false,
            throwOnError: false,
            trust: true,
            output: "htmlAndMathml",
            fleqn: false, // Don't left-align equations
            leqno: false, // Equation numbers on the right
            macros: {
              // Common macros
              "\\RR": "\\mathbb{R}",
              "\\NN": "\\mathbb{N}",
              "\\ZZ": "\\mathbb{Z}",
              "\\QQ": "\\mathbb{Q}",
              "\\CC": "\\mathbb{C}",
            },
          },
        ],
      ],
    });

    const fn = new Function(String(compiled));
    return fn(runtime);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw new Error(
      `MDX Parse Error: ${errorMessage}\n\n` +
        `Tips:\n` +
        `• For math: Use $...$ for inline and $$...$$ for block equations\n` +
        `• Escape curly braces in text: \\{ \\} or use code blocks\n` +
        `• Escape angle brackets: &lt; &gt;`,
    );
  }
}
