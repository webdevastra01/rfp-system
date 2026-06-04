import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Astra Portal",
  description: "Astra Portal is a powerful tool for managing and monitoring your Astra applications. With its intuitive interface and robust features, you can easily keep track of your application's performance, manage resources, and stay informed about important events. Whether you're a developer, administrator, or business owner, Astra Portal provides the insights and control you need to ensure your applications run smoothly and efficiently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

