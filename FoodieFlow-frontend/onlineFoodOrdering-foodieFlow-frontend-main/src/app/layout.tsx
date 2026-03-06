import "@/app/globals.css"

export const metadata = {
  title: "FoodieFlow",
  description: "Order food online fast and easy.",
   icons: {
    icon: "/utensils.svg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
