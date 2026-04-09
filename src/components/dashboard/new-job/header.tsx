import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="h-16 px-8 flex justify-between items-center bg-background border-b sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <h1 className="font-bold text-lg">Architect Logistician</h1>
        <span className="text-muted-foreground">Create New Freight Job</span>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost">Cancel</Button>
        <Button type="submit" className="bg-gradient-to-br from-primary to-primary/70">
          Save Job
        </Button>
      </div>
    </header>
  )
}