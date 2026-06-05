import Image from "next/image";
import type { ReactNode } from "react";

interface AuthShellProps {
  heroImage: string;
  heroAlt: string;
  badge: string;
  title: string;
  description: string;
  gradient?: string;
  children: ReactNode;
}

export default function AuthShell({
  heroImage,
  heroAlt,
  badge,
  title,
  description,
  gradient = "linear-gradient(90deg, rgba(14,79,42,0.85), rgba(14,79,42,0.45))",
  children,
}: AuthShellProps) {
  return (
    <div className="site-container py-10 sm:py-14">
      <div className="grid overflow-hidden rounded-2xl border border-[#dfe9e3] lg:grid-cols-[1.03fr_0.97fr]">
        <div className="relative min-h-[26rem] lg:min-h-full">
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            className="absolute inset-0 h-full w-full object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0" style={{ background: gradient }} />
          <div className="relative p-8 text-white sm:p-10">
            <p className="soft-pill inline-flex border-white/40 bg-white/10 text-white">{badge}</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight">{title}</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/88">{description}</p>
          </div>
        </div>

        <div className="bg-[#f8fcf9] p-8 sm:p-10">{children}</div>
      </div>
    </div>
  );
}
