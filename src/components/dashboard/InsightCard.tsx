export default function InsightCard() {
  return (
    <>
      <div className="md:col-span-2 bg-muted p-8 rounded-2xl">
        <h4 className="text-2xl font-bold mb-2">Network Efficiency</h4>
        <p className="text-muted-foreground mb-6">
          Your trade lanes are performing 15% above average.
        </p>
      </div>

      <div className="bg-primary text-white p-8 rounded-2xl">
        <h4 className="text-xl font-bold mb-2">AI Route Opt</h4>
        <p className="text-sm">
          Faster route found. Estimated saving: $1,240.
        </p>
      </div>
    </>
  )
}