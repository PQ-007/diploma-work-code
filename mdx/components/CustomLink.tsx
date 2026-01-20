import Link from "next/link";

export function CLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href, children, ...rest } = props;

  if (!href) return <a {...rest}>{children}</a>;

  if (href.startsWith("/")) {
    return (
      <Link
        href={href}
        {...rest}
        className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
      >
        {children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        {...rest}
        className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
      />
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
      className="inline-flex items-center gap-1 text-primary font-medium hover:underline underline-offset-4 transition-colors"
    >
      {children}
      <span aria-hidden="true" className="text-xs">
        ↗
      </span>
    </a>
  );
}