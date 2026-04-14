import { redirect } from "next/navigation"

export default function RootPage() {
  // Instantly redirect anyone who hits the root URL to the dashboard
  redirect("/dashboard")
}