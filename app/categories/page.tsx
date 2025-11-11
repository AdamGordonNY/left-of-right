import Link from "next/link";
import { Tag } from "lucide-react";
import { getCategoriesWithCounts } from "@/lib/prisma-categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Browse by Category</h1>
          <p className="text-muted-foreground mt-2">
            Explore sources organized by topic and perspective
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Tag
                          className="h-5 w-5"
                          style={{ color: category.color || "#6366f1" }}
                        />
                      </div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {category.description || "No description"}
                  </p>
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${category.color}15`,
                      borderColor: `${category.color}40`,
                      color: category.color || undefined,
                    }}
                  >
                    {category._count.sources}{" "}
                    {category._count.sources === 1 ? "source" : "sources"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No categories available yet
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
