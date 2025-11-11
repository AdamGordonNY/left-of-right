import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import {
  getCategoryBySlug,
  getSourcesByCategory,
} from "@/lib/prisma-categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateSlug } from "@/lib/slug-utils";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const sourceCategories = await getSourcesByCategory(category.id);
  const sources = sourceCategories.map((sc) => sc.source);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/categories">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Categories
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <Tag
                className="h-6 w-6"
                style={{ color: category.color || "#6366f1" }}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{category.name}</h1>
              {category.description && (
                <p className="text-muted-foreground mt-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Badge variant="secondary">
              {sources.length} {sources.length === 1 ? "source" : "sources"}
            </Badge>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {sources.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No sources in this category yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sources.map((source) => {
              const slug = generateSlug(source.name);
              const initials = source.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <Link key={source.id} href={`/${slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={source.avatarUrl || undefined}
                            alt={source.name}
                          />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">
                            {source.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {source.type}
                          </Badge>
                          {source.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {source.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
