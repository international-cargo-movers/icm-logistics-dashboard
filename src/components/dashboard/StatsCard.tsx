export default function StatsCard({
  title,
  value,
  subtitle,
  danger,
}: {
  title: string
  value: string
  subtitle: string
  danger?: boolean
}) {
  return (
    <div className="bg-muted p-6 rounded-xl">
      <p className="text-xs uppercase mb-2 text-muted-foreground">{title}</p>

      <p className={`text-4xl font-bold ${danger ? "text-red-500" : "text-primary"}`}>
        {value}
      </p>

      <p className="text-xs mt-4 text-muted-foreground">{subtitle}</p>
    </div>
  )
}