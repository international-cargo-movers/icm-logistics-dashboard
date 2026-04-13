import { Input } from "@/components/ui/input"
import { Bell, HelpCircle } from "lucide-react"

// Define the props we are receiving from the parent page
interface TopNavProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function TopNav({ searchTerm, onSearchChange }: TopNavProps) {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 px-8 flex items-center justify-between bg-background/80 backdrop-blur border-b z-40">
      
      <div className="max-w-md w-full">
        <Input 
          placeholder="Search shipments..." 
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-6">
        <Bell className="text-muted-foreground cursor-pointer" />
        <HelpCircle className="text-muted-foreground cursor-pointer" />
        <button className="text-sm font-medium">Support</button>
      </div>
    </header>
  )
}